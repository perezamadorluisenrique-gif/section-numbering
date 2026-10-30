/**
 * Folder rules: numbering settings for every note under a folder, written
 * with the same text as a note's `number headings` property. A note's own
 * property wins over its folder's rule, and the rule over the plugin's
 * settings.
 */

import { mergeNoteSettings, parseNumberingValue } from './frontmatter.ts';
import type { NoteSettings } from './frontmatter.ts';
import { rememberTemplates } from './numbering.ts';
import type { NumberingSettings } from './numbering.ts';

export interface FolderRule {
  /** Vault path of the folder; empty for the vault's root. */
  folder: string;
  /** A `number headings` value (`A.1`, `_.1.1`, `off`, ...); empty leaves the settings as they are. */
  value: string;
  /** Whether numbers are drawn on screen for this folder, or as the plugin's setting says. */
  show?: 'inherit' | 'on' | 'off';
}

/** A folder path without leading, trailing or doubled slashes; the root is the empty string. */
export function normalizeFolder(path: string): string {
  return path.trim().split('/').filter((part) => part !== '').join('/');
}

function contains(folder: string, path: string): boolean {
  return folder === '' || path.startsWith(`${folder}/`);
}

/** The rule of the deepest folder that holds `path`; the first one listed when two name the same folder. */
export function ruleFor(path: string, rules: readonly FolderRule[]): FolderRule | null {
  let best: FolderRule | null = null;
  let bestDepth = -1;
  for (const rule of rules) {
    const folder = normalizeFolder(rule.folder);
    if (!contains(folder, path)) continue;
    const depth = folder === '' ? 0 : folder.split('/').length;
    if (depth > bestDepth) {
      best = rule;
      bestDepth = depth;
    }
  }
  return best;
}

/**
 * The settings for one note: the plugin's, then its folder's rule, then its
 * own property. Null when the winning layer says `off`: a rule that turns
 * numbering off still lets a note with its own, different property number.
 */
export function resolveSettings(
  base: NumberingSettings,
  rule: FolderRule | null,
  note: NoteSettings | null,
): NumberingSettings | null {
  let settings = base;
  let ruleOff = false;
  const own = rule && rule.value.trim() !== '' ? parseNumberingValue(rule.value) : null;
  if (own) {
    if (own.off) ruleOff = true;
    else settings = mergeNoteSettings(settings, own.settings);
  }
  if (note) {
    if (note.off) return null;
    return mergeNoteSettings(settings, note.settings);
  }
  return ruleOff ? null : settings;
}

/** Every template the rules write, so renumbering after a move still recognises text a rule once wrote. */
export function ruleTemplates(rules: readonly FolderRule[], known: readonly string[] = []): string[] {
  let next = [...known];
  for (const rule of rules) {
    if (rule.value.trim() === '') continue;
    const parsed = parseNumberingValue(rule.value);
    if (!parsed.off) next = rememberTemplates(next, parsed.settings.topTemplate, parsed.settings.otherTemplate);
  }
  return next;
}

/** The rules after a folder is renamed or moved: every rule at or under it follows. */
export function renameRules(rules: readonly FolderRule[], oldPath: string, newPath: string): FolderRule[] {
  const from = normalizeFolder(oldPath);
  const to = normalizeFolder(newPath);
  return rules.map((rule) => {
    const folder = normalizeFolder(rule.folder);
    if (from === '' || (folder !== from && !folder.startsWith(`${from}/`))) return rule;
    return { ...rule, folder: to + folder.slice(from.length) };
  });
}
