/**
 * Working out the number every heading should carry, and the smallest edit
 * that gets it there.
 */

import { scanLines } from './markdown.ts';
import type { Edit } from './markdown.ts';

/** Arabic `1`, capital letters `A`, or capital Roman numerals `I`. */
export type NumberStyle = '1' | 'A' | 'I';

/** What goes between the number and the heading text. */
export const SEPARATORS = ['.', ')', ':', ' —', ' -', ''] as const;
export type Separator = (typeof SEPARATORS)[number];

export interface NumberingSettings {
  /** The heading level that gets a single number, or `auto` for the shallowest in the note. */
  firstLevel: 'auto' | 1 | 2 | 3 | 4 | 5 | 6;
  /** Deeper headings than this are left alone. */
  maxLevel: 1 | 2 | 3 | 4 | 5 | 6;
  topStyle: NumberStyle;
  otherStyle: NumberStyle;
  separator: Separator;
}

export const DEFAULT_NUMBERING: NumberingSettings = {
  firstLevel: 'auto',
  maxLevel: 6,
  topStyle: '1',
  otherStyle: '1',
  separator: '.',
};

export interface Heading {
  /** Zero-based line number. */
  line: number;
  level: number;
  /** Offsets of the heading text, after the `#`s and before any closing `#`s. */
  from: number;
  to: number;
  text: string;
}

const ATX = /^( {0,3})(#{1,6})(?=[ \t]|$)[ \t]*/;

/**
 * Every ATX heading outside frontmatter, code blocks and comments.
 *
 * Setext headings (a line underlined with `===` or `---`) are not handled:
 * a numbered prefix on them would be indistinguishable from a paragraph that
 * happens to start with a number.
 */
export function parseHeadings(text: string): Heading[] {
  const headings: Heading[] = [];
  scanLines(text).forEach((line, index) => {
    if (line.kind !== 'body') return;
    const match = ATX.exec(line.text);
    if (!match) return;
    let body = line.text.slice(match[0].length);
    // An optional closing run of #s, which must be preceded by a space or
    // make up the whole of the rest of the line.
    body = body.replace(/(^|[ \t]+)#+[ \t]*$/, '').replace(/[ \t]+$/, '');
    const from = line.start + match[0].length;
    headings.push({ line: index, level: match[2].length, from, to: from + body.length, text: body });
  });
  return headings;
}

export function formatNumber(n: number, style: NumberStyle): string {
  // A level skipped over (a ### straight under a #) counts as zero, the way
  // Pandoc numbers it, and zero has no letter or numeral.
  if (n === 0) return '0';
  if (style === 'A') {
    let out = '';
    for (let rest = n; rest > 0; rest = Math.floor((rest - 1) / 26)) {
      out = String.fromCharCode(65 + ((rest - 1) % 26)) + out;
    }
    return out;
  }
  if (style === 'I') {
    const numerals: Array<[number, string]> = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
      [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let out = '';
    let rest = n;
    for (const [value, numeral] of numerals) {
      while (rest >= value) {
        out += numeral;
        rest -= value;
      }
    }
    return out;
  }
  return String(n);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches a number this plugin could have written, at the start of a
 * heading's text, together with the space after it.
 *
 * It accepts any depth and every separator, not only the configured ones,
 * so that a heading moved to another level, or a note numbered before the
 * separator setting changed, is renumbered rather than numbered twice.
 *
 * A dotted number such as `1.2` needs no separator, which is how the
 * original Number Headings plugin writes it by default. A lone number with
 * no separator is only taken for a number when that is the configured
 * style: that is what keeps `## 2024 in review` from losing its year, and
 * why the default separator is `.`.
 */
export function numberPrefixPattern(settings: NumberingSettings): RegExp {
  const kinds = ['0', '\\d+'];
  const styles = [settings.topStyle, settings.otherStyle];
  if (styles.includes('A')) kinds.push('[A-Z]{1,2}');
  if (styles.includes('I')) kinds.push('M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})');
  const token = `(?:${kinds.join('|')})`;
  const marked = SEPARATORS.filter((s) => s !== '')
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  const dotted = `${token}(?:\\.${token}){1,5}(?:${marked})?`;
  const single = settings.separator === '' ? `${token}(?:${marked})?` : `${token}(?:${marked})`;
  return new RegExp(`^(?:${dotted}|${single})(?:[ \\t]+|$)`);
}

/** How many characters of `text` are an existing number and its space. */
export function existingPrefixLength(text: string, pattern: RegExp): number {
  const match = pattern.exec(text);
  // The Roman alternative can match the empty string; a prefix never does.
  if (!match || /^(?:[ \t]|$)/.test(match[0]) || /^[.):\-— \t]/.test(match[0])) return 0;
  return match[0].length;
}

export interface Plan {
  edits: Edit[];
  /**
   * Old heading text to new heading text, for every heading that changed.
   * When two headings shared a text, the first one wins, because that is
   * the one a link to the shared text resolved to.
   */
  renames: Map<string, string>;
  /** Headings whose text changed. */
  changed: number;
}

function firstLevelOf(headings: Heading[], settings: NumberingSettings): number {
  if (settings.firstLevel !== 'auto') return settings.firstLevel;
  const levels = headings.filter((h) => h.level <= settings.maxLevel).map((h) => h.level);
  return levels.length ? Math.min(...levels) : 1;
}

function recordRename(plan: Plan, heading: Heading, next: string): void {
  if (next === heading.text) return;
  plan.changed++;
  if (!plan.renames.has(heading.text)) plan.renames.set(heading.text, next);
}

/**
 * Numbers every heading from the first level down to the maximum level.
 *
 * A heading above the first level starts the count again, so with the first
 * level set to 2 each `#` chapter numbers its own sections from 1. Headings
 * with no text are skipped.
 */
export function planNumbering(text: string, settings: NumberingSettings): Plan {
  const plan: Plan = { edits: [], renames: new Map(), changed: 0 };
  const headings = parseHeadings(text);
  const first = firstLevelOf(headings, settings);
  const pattern = numberPrefixPattern(settings);
  let counters: number[] = [];

  for (const heading of headings) {
    if (heading.level < first) {
      counters = [];
      continue;
    }
    if (heading.level > settings.maxLevel) continue;

    const existing = existingPrefixLength(heading.text, pattern);
    if (heading.text.slice(existing).trim() === '') continue;

    const depth = heading.level - first;
    counters = counters.slice(0, depth + 1);
    while (counters.length <= depth) counters.push(0);
    counters[depth]++;

    const prefix =
      counters.map((n, i) => formatNumber(n, i === 0 ? settings.topStyle : settings.otherStyle)).join('.') +
      settings.separator +
      ' ';
    if (heading.text.slice(0, existing) !== prefix) {
      plan.edits.push({ from: heading.from, to: heading.from + existing, insert: prefix });
    }
    recordRename(plan, heading, prefix + heading.text.slice(existing));
  }
  return plan;
}

/** Takes the numbers off every heading in the numbered range. */
export function planRemoval(text: string, settings: NumberingSettings): Plan {
  const plan: Plan = { edits: [], renames: new Map(), changed: 0 };
  const headings = parseHeadings(text);
  const first = firstLevelOf(headings, settings);
  const pattern = numberPrefixPattern(settings);

  for (const heading of headings) {
    if (heading.level < first || heading.level > settings.maxLevel) continue;
    const existing = existingPrefixLength(heading.text, pattern);
    if (existing === 0 || heading.text.slice(existing).trim() === '') continue;
    plan.edits.push({ from: heading.from, to: heading.from + existing, insert: '' });
    recordRename(plan, heading, heading.text.slice(existing));
  }
  return plan;
}
