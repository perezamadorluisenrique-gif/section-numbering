/**
 * The live table of contents: a fenced block that the plugin draws as a
 * list of links to the note's headings, and draws again whenever they
 * change. Nothing is written into the note but the block itself:
 *
 *   ```section-contents
 *   depth: 2
 *   ```
 *
 * The block may carry options, one `name: value` per line:
 *
 * - `depth: N` lists only the first N numbered levels;
 * - `numbers: off` leaves the shown numbers out of the list.
 *
 * Unknown lines are ignored, so a block written by a later version still
 * draws.
 */

import { linkText } from './links.ts';
import { firstLevelOf, isSkipped, parseHeadings, shownNumbers } from './numbering.ts';
import type { NumberingSettings } from './numbering.ts';

export const LIVE_CONTENTS_LANGUAGE = 'section-contents';

export interface LiveOptions {
  /** How many numbered levels to list, or null for all of them. */
  depth: number | null;
  /** Whether shown (display-only) numbers go in front of the entries. */
  numbers: boolean;
}

export function parseLiveOptions(source: string): LiveOptions {
  const options: LiveOptions = { depth: null, numbers: true };
  for (const raw of source.split('\n')) {
    const match = /^\s*([a-z-]+)\s*:\s*(.*?)\s*$/i.exec(raw);
    if (!match) continue;
    const name = match[1].toLowerCase();
    const value = match[2].toLowerCase();
    if (name === 'depth') {
      const n = Number(value);
      if (Number.isInteger(n) && n >= 1 && n <= 6) options.depth = n;
    } else if (name === 'numbers') {
      if (value === 'off' || value === 'false' || value === 'no') options.numbers = false;
    }
  }
  return options;
}

/** One line of the live table of contents. */
export interface LiveEntry {
  /** Levels below the first numbered level: 0 for a top-level entry. */
  depth: number;
  /** The heading's text, which is what a link to it names. */
  heading: string;
  /** What the entry reads: the shown number, if any, then the heading's text. */
  label: string;
}

/**
 * The block's entries: one per heading in the numbered range, in order.
 * Skipped headings are left out, as from the written table of contents.
 *
 * `showNumbers` says whether the plugin is drawing numbers on headings that
 * have none written; the entries then carry the same numbers, so the list
 * reads like the headings look. A note whose numbers are written in the text
 * already has them in every heading's text, and so in every entry.
 */
export function liveContentsEntries(
  text: string,
  settings: NumberingSettings,
  options: LiveOptions,
  showNumbers: boolean,
): LiveEntry[] {
  const headings = parseHeadings(text);
  const first = firstLevelOf(headings, settings);
  const shown = new Map<number, string>();
  if (showNumbers && options.numbers) {
    for (const { heading, number } of shownNumbers(text, settings)) shown.set(heading.line, number);
  }
  const deepest = options.depth === null ? settings.maxLevel : Math.min(settings.maxLevel, first + options.depth - 1);
  return headings
    .filter(
      (h) => h.level >= first && h.level <= deepest && h.text.trim() !== '' && !isSkipped(h.text, settings.skipAnchor),
    )
    .map((h) => ({
      depth: h.level - first,
      heading: h.text,
      // A block id at the end of a heading is not part of how it reads.
      label: ((shown.get(h.line) ?? '') + h.text.replace(/\s+\^[\w-]+$/, '')).trim(),
    }));
}

/** The `[[#…]]` link target for a heading, as Obsidian resolves it. */
export function headingLink(heading: string): string {
  return '#' + linkText(heading);
}

/** A new, empty live block, ready to insert on its own lines. */
export function newLiveBlock(): string {
  return '```' + LIVE_CONTENTS_LANGUAGE + '\n```\n';
}
