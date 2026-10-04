/**
 * Per-note settings written in a note's front matter by the Number Headings
 * plugin, so notes it numbered keep their layout here:
 *
 *   ---
 *   number headings: auto, first-level 2, max 4, start-at 3, A.1
 *   ---
 *
 * Every part is optional and they may come in any order. What is read:
 *
 * - `off`: leave this note alone;
 * - `first-level N` and `max N`: the first and last numbered heading levels;
 * - `start-at N`: the first top-level number;
 * - a style such as `1.1`, `A.1` or `I.1`: how the top level and the levels
 *   below it are written, optionally followed by a separator (`1.1.`,
 *   `1.1)`, `1.1:`, `1.1 —`, `1.1 -`). A leading `_.` (`_.1.1`) leaves the
 *   top level unnumbered, which here means numbering starts one level lower.
 *
 * - `skip ^id`: headings whose line ends with that block id are not numbered
 *   (`skip none` turns skipping off for the note).
 *
 * `auto` is accepted and ignored: this plugin numbers on command.
 * `contents ^id` is read by `contentsAnchor`: the table of contents goes
 * after the line that ends with that block id.
 *
 * `first-level auto` (the shallowest heading) is our own addition, so that
 * `settingsToValue` can write every global setting back; Number Headings
 * ignores that part.
 *
 * A note with the key and no separator in its style gets none, which is what
 * Number Headings writes by default (`1 Introduction`).
 */

import { scanLines } from './markdown.ts';
import type { NumberStyle, NumberingSettings, Separator } from './numbering.ts';

export const FRONT_MATTER_KEY = 'number headings';

export type NoteSettings = { off: true } | { off: false; settings: Partial<NumberingSettings> };

const KEY_LINE = /^number[ _-]headings[ \t]*:[ \t]*(.*)$/i;
const STYLE = /^(_\.)?([1AI])((?:\.[1AI])*)[ \t]*(\.|\)|:|—|-)?$/;
const SEPARATOR: Record<string, Separator> = { '.': '.', ')': ')', ':': ':', '—': ' —', '-': ' -' };

type Level = 1 | 2 | 3 | 4 | 5 | 6;
const asLevel = (n: number): Level | null => (n >= 1 && n <= 6 ? (n as Level) : null);

/** The note's `number headings` entry, unquoted, or null when it has none. */
export function frontMatterValue(text: string): string | null {
  let value: string | null = null;
  for (const line of scanLines(text)) {
    if (line.kind !== 'frontmatter') {
      if (value !== null || line.text.trim() !== '') break;
      continue;
    }
    const match = KEY_LINE.exec(line.text);
    if (match) value = match[1];
  }
  return value === null ? null : value.trim().replace(/^(["'])(.*)\1$/, '$2');
}

/**
 * The block id the note's table of contents goes after, from a `contents
 * ^toc` part of its `number headings` entry, or null when it names none.
 */
export function contentsAnchor(text: string): string | null {
  const value = frontMatterValue(text);
  return value === null ? null : valueContentsAnchor(value);
}

/** The `contents ^id` part of a `number headings` value, or null. */
export function valueContentsAnchor(value: string): string | null {
  const match = /(?:^|,)\s*contents\s+\^?([\w-]+)/i.exec(value);
  return match ? match[1] : null;
}

/** The property key as it is already spelled in the note's front matter, if it is there. */
export function isFrontMatterKey(key: string): boolean {
  return KEY_LINE.test(`${key}:`);
}

const STYLE_SEPARATOR: Record<string, string> = { '.': '.', ')': ')', ':': ':', ' —': ' —', ' -': ' -', '': '' };

/**
 * The `number headings` value that makes a note follow `settings`, in the
 * form `noteSettings` reads back: `parse(write(settings))` gives the same
 * settings. A missing `startAt` is written as 1 and a missing `skipAnchor`
 * as `skip none`. `contents` carries a note's existing `contents ^id` over.
 */
export function settingsToValue(settings: NumberingSettings, contents?: string | null): string {
  const parts = [
    `first-level ${settings.firstLevel}`,
    `max ${settings.maxLevel}`,
    ...(contents ? [`contents ^${contents}`] : []),
    `skip ${settings.skipAnchor ? `^${settings.skipAnchor}` : 'none'}`,
    `start-at ${settings.startAt ?? 1}`,
    `${settings.topStyle}.${settings.otherStyle}${STYLE_SEPARATOR[settings.separator]}`,
  ];
  return parts.join(', ');
}

/** The note's own settings, or null when its front matter has no `number headings` key. */
export function noteSettings(text: string): NoteSettings | null {
  const value = frontMatterValue(text);
  if (value === null) return null;
  const settings: Partial<NumberingSettings> = { separator: '' };
  let skipTop = false;

  for (const raw of value.split(',')) {
    const part = raw.trim();
    const [word, arg] = part.split(/\s+/, 2);
    const n = Number(arg);
    switch (word.toLowerCase()) {
      case 'off':
        return { off: true };
      case 'first-level': {
        const level = asLevel(n);
        if (arg === 'auto') settings.firstLevel = 'auto';
        else if (level) settings.firstLevel = level;
        break;
      }
      case 'max': {
        const level = asLevel(n);
        if (level) settings.maxLevel = level;
        break;
      }
      case 'start-at':
        if (Number.isInteger(n) && n >= 0) settings.startAt = n;
        break;
      case 'skip':
        if (arg === 'none') settings.skipAnchor = '';
        else if (arg && /^\^[\w-]+$/.test(arg)) settings.skipAnchor = arg.slice(1);
        break;
      default: {
        const style = STYLE.exec(part);
        if (!style) break;
        skipTop = style[1] !== undefined;
        settings.topStyle = style[2] as NumberStyle;
        settings.otherStyle = (style[3].split('.')[1] ?? style[2]) as NumberStyle;
        settings.separator = style[4] ? SEPARATOR[style[4]] : '';
      }
    }
  }

  if (skipTop && typeof settings.firstLevel === 'number') {
    const level = asLevel(settings.firstLevel + 1);
    if (level) settings.firstLevel = level;
  } else if (skipTop) {
    settings.firstLevel = 2;
  }
  return { off: false, settings };
}
