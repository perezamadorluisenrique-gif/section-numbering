/**
 * The corpus behind the golden test: GOLDEN_090 is a hash of what the 0.9.0
 * code produced for it, so any drift in the numbering engine or in how a
 * note's settings are resolved shows up.
 */
import { createHash } from 'node:crypto';

import { DEFAULT_NUMBERING, planNumbering, planRemoval, shownNumbers } from '../src/numbering.ts';
import type { NumberingSettings } from '../src/numbering.ts';
import type { FolderRule } from '../src/rules.ts';
import { SAMPLES, randomNote } from './markdown-samples.ts';

export const GOLDEN_090 = '64620b0b1332ee7c823d858c074cec915a64bcc71e967629d6f436e1a0779b25';

export const NOTES: [string, string][] = [
  ...Object.entries(SAMPLES),
  ...Array.from({ length: 300 }, (_, i): [string, string] => [`seed ${i + 1}`, withHeadings(i + 1)]),
];

/** A generated note with every third line made a heading, and some of the notes' own properties. */
function withHeadings(seed: number): string {
  const lines = randomNote(seed, 14)
    .split('\n')
    .map((line, i) => (i % 3 === 0 && line !== '---' ? `${'#'.repeat(1 + ((seed * 7 + i) % 4))} ${line.replace(/^#+ /, '')}` : line));
  const body = [...lines, '', 'See [[#plain words]].'].join('\n');
  if (seed % 5 === 1) return `---\nnumber headings: auto, first-level 2, A.1\n---\n${body}`;
  if (seed % 5 === 2) return `---\nnumber headings: off\n---\n${body}`;
  return body;
}

const SETTINGS: NumberingSettings[] = [
  DEFAULT_NUMBERING,
  { ...DEFAULT_NUMBERING, separator: '' },
  { ...DEFAULT_NUMBERING, topStyle: 'I', otherStyle: 'a', separator: ')' },
  { ...DEFAULT_NUMBERING, separator: ' —', firstLevel: 2, maxLevel: 3 },
  { ...DEFAULT_NUMBERING, topTemplate: 'Chapter {n}:' },
];

const RULE_SETS: { rules: FolderRule[]; path: string }[] = [
  { rules: [], path: 'n.md' },
  { rules: [{ folder: '', value: 'A.1' }], path: 'n.md' },
  { rules: [{ folder: 'docs', value: 'off' }], path: 'docs/n.md' },
  { rules: [{ folder: '', value: '_.1.1, template-level-1 "Chapter {n}."' }], path: 'n.md' },
];

/** Works out a note's settings; `null` when it is left alone. */
export type Resolve = (path: string, text: string, base: NumberingSettings, rules: FolderRule[], readFrontMatter: boolean) => NumberingSettings | null;

export function digest(resolve: Resolve): string {
  const hash = createHash('sha256');
  for (const base of SETTINGS) {
    for (const { rules, path } of RULE_SETS) {
      for (const readFrontMatter of [true, false]) {
        for (const [name, text] of NOTES) {
          const s = resolve(path, text, base, rules, readFrontMatter);
          const out = s
            ? {
                numbering: planNumbering(text, s),
                removal: planRemoval(text, s),
                shown: shownNumbers(text, s),
              }
            : null;
          hash.update(
            `${name}|${path}|${readFrontMatter}|${JSON.stringify(out, (_k, v) => (v instanceof Map ? [...v] : v))}\n`,
          );
        }
      }
    }
  }
  return hash.digest('hex');
}

