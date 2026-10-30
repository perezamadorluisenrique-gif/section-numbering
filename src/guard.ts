/**
 * Who numbers a note. Every per-note decision goes through `decideNote`, so
 * a note another plugin manages is never numbered by two plugins at once.
 */

import type { NoteClaim, NoteRef } from './api.ts';
import { noteSettings, profileValue } from './frontmatter.ts';
import type { NumberingSettings } from './numbering.ts';
import { normalizeFolder, resolveSettings, ruleFor } from './rules.ts';
import type { FolderRule } from './rules.ts';

export type NoteDecision =
  | { kind: 'number'; settings: NumberingSettings }
  /** The note, or its folder's rule, asks to be left alone. `folder` is the rule's folder, or '' for the note. */
  | { kind: 'off'; reason: 'note' | 'folder'; folder: string }
  /** An extension numbers this note. */
  | { kind: 'claimed'; owner: string }
  /** The note names a `numbering profile` that no extension claimed. */
  | { kind: 'profile'; profile: string };

export interface DecideInput {
  path: string;
  text: string;
  base: NumberingSettings;
  rules: readonly FolderRule[];
  readFrontMatter: boolean;
  claim: (note: NoteRef) => NoteClaim | null;
}

/**
 * In this order: an extension's claim; a `numbering profile` property (not
 * empty, not `off`), which is a safety guard and applies even when reading
 * `number headings` is turned off; and then the plugin's own layers: its
 * settings, the folder's rule, the note's `number headings` property.
 */
export function decideNote(input: DecideInput): NoteDecision {
  const { path, text } = input;
  const claim = input.claim({ path, text });
  if (claim) return { kind: 'claimed', owner: claim.owner };

  const profile = profileValue(text);
  if (profile !== null && profile !== 'off') return { kind: 'profile', profile };

  const rule = ruleFor(path, input.rules);
  const own = input.readFrontMatter ? noteSettings(text) : null;
  const settings = resolveSettings(input.base, rule, own);
  if (settings) return { kind: 'number', settings };
  return {
    kind: 'off',
    reason: rule !== null && own === null ? 'folder' : 'note',
    folder: rule ? normalizeFolder(rule.folder) : '',
  };
}
