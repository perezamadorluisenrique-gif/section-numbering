/**
 * Working out the number every heading should carry, and the smallest edit
 * that gets it there.
 */

import { scanLines } from './markdown.ts';
import type { Edit } from './markdown.ts';

/**
 * Arabic `1`, capital letters `A`, capital Roman numerals `I`, their
 * lowercase forms `a` and `i`, or Chinese numerals `一` (一, 二, 三 ... 十,
 * 十一, 二十一, 一百).
 */
export type NumberStyle = '1' | 'A' | 'I' | 'a' | 'i' | '一';

export const NUMBER_STYLES: readonly NumberStyle[] = ['1', 'A', 'I', 'a', 'i', '一'];

/** The template that adds nothing around the number: the plugin's own behaviour before templates. */
export const DEFAULT_TEMPLATE = '{n}';

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
  /** The first top-level number. Optional so stored settings from 0.1 still type-check. */
  startAt?: number;
  /**
   * The block id, without the `^`, that marks a heading to leave unnumbered:
   * `skipped` skips every heading whose line ends with `^skipped`. Empty or
   * missing turns skipping off.
   */
  skipAnchor?: string;
  /**
   * The text around the number of a top-level heading, with `{n}` standing
   * for the number: `Chapter {n}.` gives `Chapter 1. Intro`. Text after
   * `{n}` replaces the separator; with none (`Chapter {n}`) the separator
   * still follows the number. Missing or invalid means `{n}`.
   */
  topTemplate?: string;
  /** The same for every heading below the top level. */
  otherTemplate?: string;
  /**
   * Templates used earlier, or by other notes, that are still recognised in
   * front of a heading so changing a template replaces the old text instead
   * of stacking a new one on it.
   */
  knownTemplates?: string[];
}

export const DEFAULT_NUMBERING: NumberingSettings = {
  firstLevel: 'auto',
  maxLevel: 6,
  topStyle: '1',
  otherStyle: '1',
  separator: '.',
  skipAnchor: 'skipped',
  topTemplate: DEFAULT_TEMPLATE,
  otherTemplate: DEFAULT_TEMPLATE,
};

/**
 * Whether a heading's text ends with the block id that marks it as skipped.
 * Like any block id it must follow whitespace (or be all there is), so
 * `## Fix a^skipped` is an ordinary heading.
 */
export function isSkipped(text: string, anchor: string | undefined): boolean {
  if (!anchor) return false;
  return new RegExp(`(?:^|\\s)\\^${escapeRegExp(anchor)}$`).test(text.replace(/\s+$/, ''));
}

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
  if (style === 'a') return formatNumber(n, 'A').toLowerCase();
  if (style === 'i') return formatNumber(n, 'I').toLowerCase();
  if (style === '一') return chineseNumeral(n);
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

const CHINESE_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const CHINESE_UNITS = ['', '十', '百', '千'];

/**
 * 1 to 9999 as Chinese numerals the way a numbered list writes them: 十,
 * 十一, 二十, 二十一, 一百, 一百零一, 一百一十, 一千零一十. Ten to nineteen
 * lose the leading 一 only at the front (十一, but 一百一十一). Past 9999
 * the digits are kept.
 */
export function chineseNumeral(n: number): string {
  if (n < 1 || n > 9999) return String(n);
  const digits = String(n).split('').map(Number);
  let out = '';
  let zero = false;
  digits.forEach((d, i) => {
    const place = digits.length - 1 - i;
    if (d === 0) {
      if (out !== '') zero = true;
      return;
    }
    if (zero) out += CHINESE_DIGITS[0];
    zero = false;
    out += d === 1 && place === 1 && out === '' ? CHINESE_UNITS[1] : CHINESE_DIGITS[d] + CHINESE_UNITS[place];
  });
  return out;
}

/** The characters a Chinese numeral is written with, as this plugin writes and reads it. */
const CHINESE_TOKEN = '[零〇一二三四五六七八九十百千]+';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface Template {
  /** Literal text before the number. */
  prefix: string;
  /** Literal text after the number; empty means the separator follows. */
  suffix: string;
}

/** Whether a template has exactly one `{n}`. */
export function isValidTemplate(template: string): boolean {
  const at = template.indexOf('{n}');
  return at >= 0 && template.indexOf('{n}', at + 3) < 0;
}

/**
 * Splits a template at its `{n}`. Surrounding whitespace is dropped, so the
 * space after the number is always the one the plugin adds. A template that
 * is missing or has no (or more than one) `{n}` is the plain `{n}`.
 */
export function parseTemplate(template: string | undefined): Template {
  const t = (template ?? DEFAULT_TEMPLATE).trim();
  if (!isValidTemplate(t)) return { prefix: '', suffix: '' };
  const at = t.indexOf('{n}');
  return { prefix: t.slice(0, at), suffix: t.slice(at + 3) };
}

/** The template for a heading `depth` levels below the first numbered level. */
export function templateFor(settings: NumberingSettings, depth: number): Template {
  return parseTemplate(depth === 0 ? settings.topTemplate : settings.otherTemplate);
}

/** Adds templates to a recognised list: only those that put text around the number, once each, newest last. */
export function rememberTemplates(known: string[] | undefined, ...templates: Array<string | undefined>): string[] {
  const out = [...(known ?? [])];
  for (const raw of templates) {
    if (raw === undefined) continue;
    const t = raw.trim();
    const { prefix, suffix } = parseTemplate(t);
    if (prefix === '' && suffix === '') continue;
    const at = out.indexOf(t);
    if (at >= 0) out.splice(at, 1);
    out.push(t);
  }
  return out.slice(-30);
}

/** `1.2` as the plugin writes it: the counters in their styles, joined by dots. */
function dottedNumber(counters: number[], settings: NumberingSettings): string {
  return counters.map((n, i) => formatNumber(n, i === 0 ? settings.topStyle : settings.otherStyle)).join('.');
}

/** A literal template part as a pattern; any run of blanks matches any run of blanks. */
function literal(text: string): string {
  return escapeRegExp(text).replace(/[ \t]+/g, '[ \\t]+');
}

function tokenPattern(styles: NumberStyle[], withChinese: boolean): string {
  const kinds = ['0', '\\d+'];
  if (styles.includes('A')) kinds.push('[A-Z]{1,2}');
  if (styles.includes('a')) kinds.push('[a-z]{1,2}');
  // The lookahead keeps the Roman pattern from matching nothing at all.
  if (styles.includes('I')) kinds.push('(?=[MDCLXVI])M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})');
  if (styles.includes('i')) kinds.push('(?=[mdclxvi])m{0,3}(?:cm|cd|d?c{0,3})(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})');
  if (withChinese || styles.includes('一')) kinds.push(CHINESE_TOKEN);
  return `(?:${kinds.join('|')})`;
}

/** The two halves of the number pattern: a bare number, and a number inside a known template. */
function prefixSources(settings: NumberingSettings): { bare: string; templated: string | null } {
  const styles = [settings.topStyle, settings.otherStyle];
  // Chinese numerals are told apart from words by their characters alone, so
  // a note numbered with them is still read after the style was changed. The
  // letters and Roman numerals are only read when configured.
  const configured = tokenPattern(styles, false);
  const any = tokenPattern(styles, true);
  const marked = SEPARATORS.filter((s) => s !== '')
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  const dotted = `${any}(?:\\.${any}){1,5}(?:${marked})?`;
  const single = settings.separator === '' ? `${configured}(?:${marked})?` : `${any}(?:${marked})`;
  const bare = `(?:${dotted}|${single})`;

  const seen = new Set<string>();
  const alternatives: string[] = [];
  for (const raw of [settings.topTemplate, settings.otherTemplate, ...(settings.knownTemplates ?? [])]) {
    const { prefix, suffix } = parseTemplate(raw);
    if (prefix === '' && suffix === '') continue;
    const key = prefix + '\u0000' + suffix;
    if (seen.has(key)) continue;
    seen.add(key);
    alternatives.push(
      suffix !== ''
        ? `${literal(prefix)}${any}(?:\\.${any})*${literal(suffix)}`
        : `${literal(prefix)}${bare}`,
    );
  }
  return { bare, templated: alternatives.length ? `(?:${alternatives.join('|')})` : null };
}

const TAIL = '(?:[ \\t]+|$)';

/**
 * Matches a number this plugin could have written, at the start of a
 * heading's text, together with the space after it.
 *
 * It accepts any depth and every separator, not only the configured ones,
 * so that a heading moved to another level, or a note numbered before the
 * separator setting changed, is renumbered rather than numbered twice.
 * It also accepts the number inside any template the plugin knows (the
 * configured ones and the ones used before), so `Chapter 1. Intro` is one
 * numbered heading and not `Intro` under a stray `Chapter 1.`.
 *
 * A dotted number such as `1.2` needs no separator, which is how the
 * original Number Headings plugin writes it by default. A lone number with
 * no separator is only taken for a number when that is the configured
 * style: that is what keeps `## 2024 in review` from losing its year, and
 * why the default separator is `.`.
 */
export function numberPrefixPattern(settings: NumberingSettings): RegExp {
  const { bare, templated } = prefixSources(settings);
  return new RegExp(`^(?:${templated ? `${templated}|` : ''}${bare})${TAIL}`);
}

interface PrefixMatcher {
  bare: RegExp;
  templated: RegExp | null;
}

function prefixMatcher(settings: NumberingSettings): PrefixMatcher {
  const { bare, templated } = prefixSources(settings);
  return {
    bare: new RegExp(`^${bare}${TAIL}`),
    templated: templated ? new RegExp(`^${templated}${TAIL}`) : null,
  };
}

/** The length of an existing number and whether it is a bare one (no template text). */
function matchPrefix(text: string, matcher: PrefixMatcher): { length: number; bare: boolean } {
  const bare = existingPrefixLength(text, matcher.bare);
  const templated = matcher.templated ? existingPrefixLength(text, matcher.templated) : 0;
  return templated > bare ? { length: templated, bare: false } : { length: bare, bare: true };
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

export function firstLevelOf(headings: Heading[], settings: NumberingSettings): number {
  if (settings.firstLevel !== 'auto') return settings.firstLevel;
  // A skipped heading, often the note's title, must not decide where the numbering starts.
  const levels = headings
    .filter((h) => h.level <= settings.maxLevel && !isSkipped(h.text, settings.skipAnchor))
    .map((h) => h.level);
  return levels.length ? Math.min(...levels) : 1;
}

/**
 * How many characters of each heading's text are an existing number, as
 * `existingPrefixLength` reads it, with one correction for a note that is
 * not numbered throughout.
 *
 * A dotted number with no separator after it, such as `2.0` in `## 2.0
 * migration`, is also how a version or a decimal starts a heading. It is
 * only taken for a number, and replaced, when every heading in range starts
 * with a number: a note numbered by the original Number Headings plugin is,
 * and a note that merely mentions a version is not. With the separator set
 * to none the plugin writes such numbers itself, so they always count.
 */
function existingPrefixes(headings: Heading[], settings: NumberingSettings, first: number): number[] {
  const matcher = prefixMatcher(settings);
  const inRange = (h: Heading) => h.level >= first && h.level <= settings.maxLevel;
  const skipped = headings.map((h) => isSkipped(h.text, settings.skipAnchor));
  const matches = headings.map((h) => (inRange(h) ? matchPrefix(h.text, matcher) : { length: 0, bare: true }));
  const lengths = matches.map((m) => m.length);
  if (settings.separator === '') return lengths;

  // Skipped headings are the unnumbered ones, so they neither break "numbered
  // throughout" nor count as versions. They only lose a number this plugin
  // writes with a separator, never a bare `2.0`.
  const counted = lengths.map((length, i) => (skipped[i] ? 0 : length));
  // Only a bare number can be a version or a year; text from a template cannot.
  const bareCounted = counted.map((length, i) => (matches[i].bare ? length : 0));
  const numberedThroughout = headings.every(
    (h, i) => !inRange(h) || skipped[i] || counted[i] > 0 || h.text.trim() === '',
  );
  const keepAll = numberedThroughout && !looksLikeVersions(headings, bareCounted, first);
  return lengths.map((length, i) =>
    (keepAll && !skipped[i]) || !matches[i].bare || !isUnmarked(headings[i].text.slice(0, length)) ? length : 0,
  );
}

/**
 * Whether the unmarked dotted numbers in a note read as version numbers
 * rather than an outline, as in a changelog: `## 2.0.1`, `## 2.0.0`,
 * `## 1.9.0`. An outline's numbers go up in the order they appear and have
 * as many parts as the heading is deep. Versions listed newest first go
 * down, and have three parts or more, whatever the heading's depth. All of
 * it must hold, so a numbered note whose sections were moved, or whose
 * headings changed level, is still renumbered. Two-part versions such as
 * `2.1` cannot be told from an outline this way and are still replaced.
 */
function looksLikeVersions(headings: Heading[], lengths: number[], first: number): boolean {
  const unmarked: Array<{ parts: number[]; depth: number }> = [];
  headings.forEach((h, i) => {
    const prefix = h.text.slice(0, lengths[i]).replace(/[ \t]+$/, '');
    if (lengths[i] === 0 || !isUnmarked(prefix) || !/^\d+(?:\.\d+)+$/.test(prefix)) return;
    unmarked.push({ parts: prefix.split('.').map(Number), depth: h.level - first + 1 });
  });
  if (unmarked.length === 0) return false;
  if (unmarked.some((n) => n.parts.length < 3 || n.parts.length === n.depth)) return false;
  return unmarked.some((n, i) => i > 0 && compareParts(n.parts, unmarked[i - 1].parts) <= 0);
}

function compareParts(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? -1) - (b[i] ?? -1);
    if (d !== 0) return d;
  }
  return 0;
}

/** A number with no separator after it: its last character is a digit or letter. */
function isUnmarked(prefix: string): boolean {
  return /[0-9A-Za-z零〇一二三四五六七八九十百千]$/.test(prefix.replace(/[ \t]+$/, ''));
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
 *
 * A heading marked with the skip anchor (`## Preface ^skipped`) is not
 * numbered and takes no number, and a number this plugin gave it earlier is
 * taken off. As in Number Headings it is ignored altogether, as if the line
 * were not a heading: its subheadings are still numbered, and they carry on
 * from the nearest numbered heading above, not from the skipped one. A
 * skipped heading above the first level still restarts the count, like any
 * other.
 */
export function planNumbering(text: string, settings: NumberingSettings): Plan {
  const plan: Plan = { edits: [], renames: new Map(), changed: 0 };
  const headings = parseHeadings(text);
  const first = firstLevelOf(headings, settings);
  const prefixes = existingPrefixes(headings, settings, first);
  const numbers = outlineNumbers(headings, settings, first, prefixes);

  headings.forEach((heading, index) => {
    const existing = prefixes[index];
    const prefix = numbers[index];
    if (prefix === undefined) {
      // A skipped heading loses a number it was given earlier.
      if (existing > 0 && isSkipped(heading.text, settings.skipAnchor) && inNumberedRange(heading, settings, first)) {
        if (heading.text.slice(existing).trim() === '') return;
        plan.edits.push({ from: heading.from, to: heading.from + existing, insert: '' });
        recordRename(plan, heading, heading.text.slice(existing));
      }
      return;
    }
    if (heading.text.slice(0, existing) !== prefix) {
      plan.edits.push({ from: heading.from, to: heading.from + existing, insert: prefix });
    }
    recordRename(plan, heading, prefix + heading.text.slice(existing));
  });
  return plan;
}

function inNumberedRange(heading: Heading, settings: NumberingSettings, first: number): boolean {
  return heading.level >= first && heading.level <= settings.maxLevel;
}

/**
 * The number each heading should carry, with its separator and the space
 * after it (`1.2. `), indexed like `headings`; undefined for a heading that
 * takes none: above or below the numbered range, empty, or skipped.
 *
 * A heading above the first level starts the count again, so with the first
 * level set to 2 each `#` chapter numbers its own sections from 1. Headings
 * with no text are skipped. A heading marked with the skip anchor
 * (`## Preface ^skipped`) is ignored altogether, as in Number Headings: its
 * subheadings carry on from the nearest numbered heading above.
 */
function outlineNumbers(
  headings: Heading[],
  settings: NumberingSettings,
  first: number,
  prefixes: number[],
): Array<string | undefined> {
  const out: Array<string | undefined> = [];
  let counters: number[] = [];
  headings.forEach((heading, index) => {
    out.push(undefined);
    if (heading.level < first) {
      counters = [];
      return;
    }
    if (heading.level > settings.maxLevel) return;
    if (heading.text.slice(prefixes[index]).trim() === '') return;
    if (isSkipped(heading.text, settings.skipAnchor)) return;

    const depth = heading.level - first;
    counters = counters.slice(0, depth + 1);
    while (counters.length <= depth) counters.push(counters.length === 0 ? (settings.startAt ?? 1) - 1 : 0);
    counters[depth]++;
    const { prefix, suffix } = templateFor(settings, depth);
    out[index] = prefix + dottedNumber(counters, settings) + (suffix !== '' ? suffix : settings.separator) + ' ';
  });
  return out;
}

/** A heading and the number shown in front of it, for display only. */
export interface ShownNumber {
  heading: Heading;
  /** The number with its separator and trailing space, as `1.2. `. */
  number: string;
}

/**
 * The numbers to draw in front of the headings of a note whose text carries
 * none: the same numbers *Number headings* would write, worked out the same
 * way, but for showing only. A note where any heading in range already has a
 * written number gets none drawn, so a number never shows twice.
 */
export function shownNumbers(text: string, settings: NumberingSettings): ShownNumber[] {
  const headings = parseHeadings(text);
  const first = firstLevelOf(headings, settings);
  const prefixes = existingPrefixes(headings, settings, first);
  const written = headings.some(
    (h, i) => prefixes[i] > 0 && inNumberedRange(h, settings, first) && !isSkipped(h.text, settings.skipAnchor),
  );
  if (written) return [];
  const numbers = outlineNumbers(headings, settings, first, prefixes);
  const out: ShownNumber[] = [];
  headings.forEach((heading, i) => {
    const number = numbers[i];
    if (number !== undefined) out.push({ heading, number });
  });
  return out;
}

/** Takes the numbers off every heading in the numbered range. */
export function planRemoval(text: string, settings: NumberingSettings): Plan {
  const plan: Plan = { edits: [], renames: new Map(), changed: 0 };
  const headings = parseHeadings(text);
  const first = firstLevelOf(headings, settings);
  const prefixes = existingPrefixes(headings, settings, first);

  headings.forEach((heading, index) => {
    if (heading.level < first || heading.level > settings.maxLevel) return;
    const existing = prefixes[index];
    if (existing === 0 || heading.text.slice(existing).trim() === '') return;
    plan.edits.push({ from: heading.from, to: heading.from + existing, insert: '' });
    recordRename(plan, heading, heading.text.slice(existing));
  });
  return plan;
}
