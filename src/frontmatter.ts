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
 * `auto` and `skip …` are accepted and ignored: this plugin numbers on
 * command. `contents ^id` is read by `contentsAnchor`: the table of contents
 * goes after the line that ends with that block id.
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
  const match = value === null ? null : /(?:^|,)\s*contents\s+\^?([\w-]+)/i.exec(value);
  return match ? match[1] : null;
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
        if (level) settings.firstLevel = level;
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
