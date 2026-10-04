import { App, Editor, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';

import { DEFAULT_ANCHOR, hasContents, newContents, updateContents } from './src/contents.ts';
import { FRONT_MATTER_KEY, contentsAnchor, isFrontMatterKey, noteSettings, settingsToValue, valueContentsAnchor } from './src/frontmatter.ts';
import { retargetLinks } from './src/links.ts';
import type { Edit } from './src/markdown.ts';
import { applyEdits } from './src/markdown.ts';
import { DEFAULT_NUMBERING, planNumbering, planRemoval } from './src/numbering.ts';
import type { NumberStyle, NumberingSettings, Plan, Separator } from './src/numbering.ts';

interface SectionNumberingSettings extends NumberingSettings {
  /** Rewrite links in other notes that point at a renumbered heading. */
  updateLinks: boolean;
  /** Follow a note's `number headings` front matter, as Number Headings wrote it. */
  readFrontMatter: boolean;
}

const DEFAULT_SETTINGS: SectionNumberingSettings = { ...DEFAULT_NUMBERING, updateLinks: true, readFrontMatter: true };

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export default class SectionNumberingPlugin extends Plugin {
  settings: SectionNumberingSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'number-headings',
      name: 'Number headings in this note',
      icon: 'list-ordered',
      editorCallback: (editor, ctx) => {
        const settings = this.settingsFor(editor.getValue());
        if (settings) void this.apply(editor, ctx.file, planNumbering(editor.getValue(), settings), 'Numbered');
      },
    });
    this.addCommand({
      id: 'remove-heading-numbers',
      name: 'Remove heading numbers in this note',
      icon: 'list-x',
      editorCallback: (editor, ctx) => {
        const settings = this.settingsFor(editor.getValue());
        if (settings) void this.apply(editor, ctx.file, planRemoval(editor.getValue(), settings), 'Removed numbers from');
      },
    });

    this.addCommand({
      id: 'table-of-contents',
      name: 'Insert or update table of contents',
      icon: 'list-tree',
      editorCallback: (editor) => {
        const text = editor.getValue();
        const settings = this.settingsFor(text);
        if (!settings) return;
        const anchor = this.anchorFor(text);
        if (hasContents(text, anchor)) {
          const edit = updateContents(text, text, settings, anchor);
          if (edit) {
            editor.transaction({
              changes: [{ from: editor.offsetToPos(edit.from), to: editor.offsetToPos(edit.to), text: edit.insert }],
            });
          }
          new Notice(edit ? 'Updated the table of contents.' : 'The table of contents is up to date.');
          return;
        }
        const cursor = editor.getCursor();
        const line = editor.getLine(cursor.line);
        const block = newContents(text, settings, anchor);
        if (line.trim() === '') {
          editor.transaction({ changes: [{ from: { line: cursor.line, ch: 0 }, text: block }] });
        } else {
          const end = { line: cursor.line, ch: line.length };
          editor.transaction({ changes: [{ from: end, text: '\n' + block.replace(/\n$/, '') }] });
        }
        new Notice('Inserted a table of contents. Numbering the headings keeps it up to date.');
      },
    });

    this.addCommand({
      id: 'save-settings-to-properties',
      name: "Save numbering settings to this note's properties",
      icon: 'save',
      editorCheckCallback: (checking, _editor, ctx) => {
        const file = ctx.file;
        if (!file) return false;
        if (!checking) void this.saveSettingsToProperties(file);
        return true;
      },
    });

    this.addSettingTab(new SectionNumberingSettingTab(this.app, this));
  }

  /**
   * Writes the plugin's current settings into the note's `number headings`
   * property, in the form `settingsToValue` produces and `noteSettings`
   * reads. An existing `contents ^id` part is kept; any other part is
   * replaced, `off` included. Needs no setting to be on: it is how a note
   * is made to follow its own settings.
   */
  private async saveSettingsToProperties(file: TFile): Promise<void> {
    const s = this.settings;
    const numbering: NumberingSettings = {
      firstLevel: s.firstLevel,
      maxLevel: s.maxLevel,
      topStyle: s.topStyle,
      otherStyle: s.otherStyle,
      separator: s.separator,
      startAt: s.startAt,
      skipAnchor: s.skipAnchor,
    };
    try {
      await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
        const key = Object.keys(fm).find(isFrontMatterKey) ?? FRONT_MATTER_KEY;
        const old = fm[key];
        const contents = typeof old === 'string' ? valueContentsAnchor(old) : null;
        fm[key] = settingsToValue(numbering, contents);
      });
      new Notice(
        this.settings.readFrontMatter
          ? 'Saved the numbering settings to this note\'s properties.'
          : 'Saved the numbering settings to this note\'s properties. They only apply while "Follow Number Headings properties" is on.',
      );
    } catch (error) {
      console.error('section-numbering: could not save the settings to the properties', error);
      new Notice("Could not write this note's properties. Check that they are valid YAML.");
    }
  }

  /** The block id the table of contents follows: the note's own, or `^toc`. */
  private anchorFor(text: string): string {
    return (this.settings.readFrontMatter && contentsAnchor(text)) || DEFAULT_ANCHOR;
  }

  /**
   * The settings for one note: the plugin's, with the note's own
   * `number headings` front matter over them. Null, after saying why, when
   * the note asks to be left alone.
   */
  private settingsFor(text: string): NumberingSettings | null {
    if (!this.settings.readFrontMatter) return this.settings;
    const own = noteSettings(text);
    if (own === null) return this.settings;
    if (own.off) {
      new Notice('This note has "number headings: off" in its properties, so its headings were left alone.');
      return null;
    }
    return { ...this.settings, ...own.settings };
  }

  async loadSettings() {
    // Whatever is on disk was written by some version of this plugin, or
    // edited by hand, so it is merged over the defaults rather than trusted.
    const stored = (await this.loadData()) as Partial<SectionNumberingSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...stored };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Applies a plan to the note in the editor, then fixes the links.
   *
   * The headings and the links within the note change in one editor
   * transaction, so a single undo puts the whole note back. Links in other
   * notes are rewritten on disk afterwards; undo in this note does not
   * reach them, which the notice says.
   */
  private async apply(editor: Editor, file: TFile | null, plan: Plan, verb: string): Promise<void> {
    const text = editor.getValue();
    // The table of contents, if the note has one, follows the headings as
    // they will be after this edit, in the same transaction.
    const settings = this.settingsFor(text) ?? this.settings;
    const contents = updateContents(text, applyEdits(text, plan.edits), settings, this.anchorFor(text));
    if (plan.changed === 0) {
      if (contents) {
        editor.transaction({
          changes: [{ from: editor.offsetToPos(contents.from), to: editor.offsetToPos(contents.to), text: contents.insert }],
        });
        new Notice('No heading needed changing. Updated the table of contents.');
      } else {
        new Notice('No heading needed changing.');
      }
      return;
    }

    // Links inside the table of contents are rewritten with it, not here.
    const own = (
      file ? retargetLinks(text, plan.renames, (path) => path === '' || this.resolves(path, file.path, file)) : []
    ).filter((edit) => !contents || edit.to <= contents.from || edit.from >= contents.to);
    const edits = [...plan.edits, ...own, ...(contents ? [contents] : [])];
    editor.transaction({
      changes: edits.map((edit) => ({
        from: editor.offsetToPos(edit.from),
        to: editor.offsetToPos(edit.to),
        text: edit.insert,
      })),
    });

    let message = `${verb} ${count(plan.changed, 'heading')}.`;
    if (file && this.settings.updateLinks) {
      const { links, notes } = await this.updateLinksElsewhere(file, plan.renames);
      if (links > 0) message += ` Updated ${count(links, 'link')} in ${count(notes, 'other note')}.`;
    }
    new Notice(message);
  }

  private resolves(path: string, sourcePath: string, target: TFile): boolean {
    return this.app.metadataCache.getFirstLinkpathDest(path, sourcePath) === target;
  }

  /**
   * Rewrites links into `target` from every note that links to it.
   *
   * The metadata cache says which notes link to the file at all; each of
   * them is then read afresh inside `vault.process`, and its links are
   * worked out from that text, so an edit never lands on a stale offset.
   */
  private async updateLinksElsewhere(
    target: TFile,
    renames: Map<string, string>,
  ): Promise<{ links: number; notes: number }> {
    let links = 0;
    let notes = 0;
    const resolved = this.app.metadataCache.resolvedLinks;
    for (const sourcePath of Object.keys(resolved)) {
      if (sourcePath === target.path || !resolved[sourcePath][target.path]) continue;
      const source = this.app.vault.getAbstractFileByPath(sourcePath);
      if (!(source instanceof TFile) || source.extension !== 'md') continue;

      let edits: Edit[] = [];
      await this.app.vault.process(source, (data) => {
        edits = retargetLinks(data, renames, (path) => path !== '' && this.resolves(path, sourcePath, target));
        return edits.length ? applyEdits(data, edits) : data;
      });
      if (edits.length) {
        links += edits.length;
        notes++;
      }
    }
    return { links, notes };
  }
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

const STYLE_OPTIONS: Record<NumberStyle, string> = {
  '1': '1, 2, 3',
  A: 'A, B, C',
  I: 'I, II, III',
};

const SEPARATOR_OPTIONS: Record<Separator, string> = {
  '.': '1.2. Heading',
  ')': '1.2) Heading',
  ':': '1.2: Heading',
  ' —': '1.2 — Heading',
  ' -': '1.2 - Heading',
  '': '1.2 Heading',
};

const LEVEL_OPTIONS: Record<string, string> = {};
for (const level of LEVELS) LEVEL_OPTIONS[String(level)] = `Heading ${level}`;

type SettingKey = keyof SectionNumberingSettings;

interface SettingRow {
  key: SettingKey;
  name: string;
  desc: string;
  /** A dropdown's options, value to label; with no options this is a toggle, or a text box when `text` is set. */
  options?: Record<string, string>;
  text?: boolean;
}

/**
 * Every setting, described once. Both renderings below are built from this
 * table, so the declarative one and the pre-1.13 fallback cannot drift.
 */
const SETTINGS: SettingRow[] = [
  {
    key: 'firstLevel',
    name: 'First numbered level',
    desc:
      'The heading level that gets a single number. Automatic uses the shallowest heading in each note. ' +
      'Shallower headings stay unnumbered and restart the count.',
    options: { auto: 'Automatic', ...LEVEL_OPTIONS },
  },
  {
    key: 'maxLevel',
    name: 'Last numbered level',
    desc: 'Deeper headings are left as they are.',
    options: LEVEL_OPTIONS,
  },
  { key: 'topStyle', name: 'Top-level numbers', desc: 'How the first number is written.', options: STYLE_OPTIONS },
  {
    key: 'otherStyle',
    name: 'Lower-level numbers',
    desc: 'How every number after the first is written.',
    options: STYLE_OPTIONS,
  },
  {
    key: 'separator',
    name: 'Separator',
    desc:
      'What follows the number. With no separator, a heading that already starts with a number, ' +
      'such as "2024 in review", is taken to be numbered and loses it.',
    options: SEPARATOR_OPTIONS,
  },
  {
    key: 'skipAnchor',
    name: 'Skip anchor',
    desc:
      'A heading whose line ends with this block id, such as "## Preface ^skipped", is not numbered and takes no number. ' +
      'It stays out of the table of contents. Leave empty to turn skipping off.',
    text: true,
  },
  {
    key: 'readFrontMatter',
    name: 'Follow Number Headings properties',
    desc:
      'A note whose properties have a "number headings" entry, as the Number Headings plugin writes it, ' +
      'is numbered the way that entry says, and "number headings: off" leaves the note alone.',
  },
  {
    key: 'updateLinks',
    name: 'Update links in other notes',
    desc:
      'When a heading is renumbered, rewrite links to it in the rest of the vault so they keep working. ' +
      'Links within the note itself are always updated.',
  },
];

/** What a control shows: numbers as strings, the skip anchor with its `^`. */
function displayValue(key: string, value: unknown): unknown {
  if (key === 'skipAnchor') return value ? `^${(value as string)}` : '';
  return typeof value === 'number' ? String(value) : value;
}

/** Levels are stored as numbers, but a dropdown only deals in strings. */
function toStored(key: SettingKey, value: unknown): unknown {
  if ((key === 'firstLevel' || key === 'maxLevel') && value !== 'auto') return Number(value);
  return value;
}

class SectionNumberingSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: SectionNumberingPlugin) {
    super(app, plugin);
  }

  /**
   * The settings, described rather than drawn, so Obsidian 1.13 and later
   * renders them itself and finds them in the settings search. Older
   * versions do not know this method and call `display()` instead.
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return SETTINGS.map((row) => ({
      name: row.name,
      desc: row.desc,
      control: row.text
        ? { type: 'text' as const, key: row.key, placeholder: '^skipped', defaultValue: '^skipped' }
        : row.options
        ? { type: 'dropdown' as const, key: row.key, options: row.options, defaultValue: String(DEFAULT_SETTINGS[row.key]) }
        : { type: 'toggle' as const, key: row.key, defaultValue: DEFAULT_SETTINGS[row.key] as boolean },
    }));
  }

  getControlValue(key: string): unknown {
    return displayValue(key, this.plugin.settings[key as SettingKey]);
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === 'skipAnchor') {
      // "^skipped" or "skipped"; anything that is not a block id is not taken.
      const id = (typeof value === 'string' ? value : '').trim().replace(/^\^/, '');
      if (id !== '' && !/^[\w-]+$/.test(id)) return;
      value = id;
    }
    Object.assign(this.plugin.settings, { [key]: toStored(key as SettingKey, value) });
    await this.plugin.saveSettings();
  }

  /** The pre-1.13 rendering; a current Obsidian never calls it. */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    for (const row of SETTINGS) {
      const setting = new Setting(containerEl).setName(row.name).setDesc(row.desc);
      const current = this.getControlValue(row.key);
      if (row.options) {
        const options = row.options;
        setting.addDropdown((dropdown) => {
          dropdown
            .addOptions(options)
            .setValue(String(current))
            .onChange((value) => this.setControlValue(row.key, value));
        });
      } else if (row.text) {
        setting.addText((text) => {
          text
            .setPlaceholder('^skipped')
            .setValue(String(current))
            .onChange((value) => this.setControlValue(row.key, value));
        });
      } else {
        setting.addToggle((toggle) => {
          toggle.setValue(current === true).onChange((value) => this.setControlValue(row.key, value));
        });
      }
    }
  }
}
