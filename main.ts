import { App, Editor, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';

import { retargetLinks } from './src/links.ts';
import type { Edit } from './src/markdown.ts';
import { applyEdits } from './src/markdown.ts';
import { DEFAULT_NUMBERING, planNumbering, planRemoval } from './src/numbering.ts';
import type { NumberStyle, NumberingSettings, Plan, Separator } from './src/numbering.ts';

interface SectionNumberingSettings extends NumberingSettings {
  /** Rewrite links in other notes that point at a renumbered heading. */
  updateLinks: boolean;
}

const DEFAULT_SETTINGS: SectionNumberingSettings = { ...DEFAULT_NUMBERING, updateLinks: true };

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export default class SectionNumberingPlugin extends Plugin {
  settings: SectionNumberingSettings = { ...DEFAULT_SETTINGS };

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'number-headings',
      name: 'Number headings in this note',
      editorCallback: (editor, ctx) => {
        void this.apply(editor, ctx.file, planNumbering(editor.getValue(), this.settings), 'Numbered');
      },
    });
    this.addCommand({
      id: 'remove-heading-numbers',
      name: 'Remove heading numbers in this note',
      editorCallback: (editor, ctx) => {
        void this.apply(editor, ctx.file, planRemoval(editor.getValue(), this.settings), 'Removed numbers from');
      },
    });

    this.addSettingTab(new SectionNumberingSettingTab(this.app, this));
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
    if (plan.changed === 0) {
      new Notice('No heading needed changing.');
      return;
    }

    const text = editor.getValue();
    const own = file
      ? retargetLinks(text, plan.renames, (path) => path === '' || this.resolves(path, file.path, file))
      : [];
    const edits = [...plan.edits, ...own];
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
  /** A dropdown's options, value to label; none means a toggle. */
  options?: Record<string, string>;
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
    key: 'updateLinks',
    name: 'Update links in other notes',
    desc:
      'When a heading is renumbered, rewrite links to it in the rest of the vault so they keep working. ' +
      'Links within the note itself are always updated.',
  },
];

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
      control: row.options
        ? { type: 'dropdown' as const, key: row.key, options: row.options, defaultValue: String(DEFAULT_SETTINGS[row.key]) }
        : { type: 'toggle' as const, key: row.key, defaultValue: DEFAULT_SETTINGS[row.key] as boolean },
    }));
  }

  getControlValue(key: string): unknown {
    const value = this.plugin.settings[key as SettingKey];
    return typeof value === 'number' ? String(value) : value;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
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
      } else {
        setting.addToggle((toggle) => {
          toggle.setValue(current === true).onChange((value) => this.setControlValue(row.key, value));
        });
      }
    }
  }
}
