import { App, Editor, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

import { retargetLinks } from './src/links.ts';
import type { Edit } from './src/markdown.ts';
import { applyEdits } from './src/markdown.ts';
import { DEFAULT_NUMBERING, SEPARATORS, planNumbering, planRemoval } from './src/numbering.ts';
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

const SEPARATOR_LABELS: Record<Separator, string> = {
  '.': '1.2. Heading',
  ')': '1.2) Heading',
  ':': '1.2: Heading',
  ' —': '1.2 — Heading',
  ' -': '1.2 - Heading',
  '': '1.2 Heading',
};

class SectionNumberingSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: SectionNumberingPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.settings;
    containerEl.empty();

    new Setting(containerEl)
      .setName('First numbered level')
      .setDesc(
        'The heading level that gets a single number. Automatic uses the shallowest heading in each note. ' +
          'Shallower headings stay unnumbered and restart the count.',
      )
      .addDropdown((dropdown) => {
        dropdown.addOption('auto', 'Automatic');
        for (const level of LEVELS) dropdown.addOption(String(level), `Heading ${level}`);
        dropdown.setValue(String(settings.firstLevel)).onChange(async (value) => {
          settings.firstLevel = value === 'auto' ? 'auto' : (Number(value) as NumberingSettings['maxLevel']);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Last numbered level')
      .setDesc('Deeper headings are left as they are.')
      .addDropdown((dropdown) => {
        for (const level of LEVELS) dropdown.addOption(String(level), `Heading ${level}`);
        dropdown.setValue(String(settings.maxLevel)).onChange(async (value) => {
          settings.maxLevel = Number(value) as NumberingSettings['maxLevel'];
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Top-level numbers')
      .addDropdown((dropdown) => {
        dropdown.addOptions(STYLE_OPTIONS).setValue(settings.topStyle).onChange(async (value) => {
          settings.topStyle = value as NumberStyle;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Lower-level numbers')
      .addDropdown((dropdown) => {
        dropdown.addOptions(STYLE_OPTIONS).setValue(settings.otherStyle).onChange(async (value) => {
          settings.otherStyle = value as NumberStyle;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Separator')
      .setDesc(
        'What follows the number. With no separator, a heading that already starts with a number, ' +
          'such as "2024 in review", is taken to be numbered and loses it.',
      )
      .addDropdown((dropdown) => {
        for (const separator of SEPARATORS) dropdown.addOption(separator, SEPARATOR_LABELS[separator]);
        dropdown.setValue(settings.separator).onChange(async (value) => {
          settings.separator = value as Separator;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Update links in other notes')
      .setDesc(
        'When a heading is renumbered, rewrite links to it in the rest of the vault so they keep working. ' +
          'Links within the note itself are always updated.',
      )
      .addToggle((toggle) => {
        toggle.setValue(settings.updateLinks).onChange(async (value) => {
          settings.updateLinks = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
