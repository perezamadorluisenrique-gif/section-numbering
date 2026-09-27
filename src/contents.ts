/**
 * A table of contents that stays in step with the numbers.
 *
 * It sits right after a line that ends with a block id, `^toc` unless the
 * note's `number headings: contents ^id` names another, which is where the
 * Number Headings plugin put its own. It is a list of links to the
 * headings, indented by level, and it is rewritten whenever the headings
 * are numbered, renumbered or stripped of their numbers.
 */

import { linkText } from './links.ts';
import { scanLines } from './markdown.ts';
import type { Edit } from './markdown.ts';
import { firstLevelOf, parseHeadings } from './numbering.ts';
import type { NumberingSettings } from './numbering.ts';

export const DEFAULT_ANCHOR = 'toc';

/** A list item that links to a heading in the same note: one line of a table of contents. */
const ENTRY = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+\[\[#/;

/** Where the table of contents is, as line numbers: the anchor line and the list after it. */
interface Region {
  anchor: number;
  /** First and last line of the list, or null when there is none yet. */
  list: [number, number] | null;
}

function findRegion(text: string, anchor: string): Region | null {
  const lines = scanLines(text);
  const tail = new RegExp(`(?:^|\\s)\\^${escape(anchor)}$`);
  const at = lines.findIndex((line) => line.kind === 'body' && tail.test(line.text.trim()));
  if (at < 0) return null;
  let end = at;
  while (end + 1 < lines.length && lines[end + 1].kind === 'body' && ENTRY.test(lines[end + 1].text)) end++;
  return { anchor: at, list: end > at ? [at + 1, end] : null };
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whether the note already has the line a table of contents goes after. */
export function hasContents(text: string, anchor = DEFAULT_ANCHOR): boolean {
  return findRegion(text, anchor) !== null;
}

/**
 * The list itself, one line per heading in the numbered range, indented one
 * tab per level below the first. `headingsFrom` is the text whose headings
 * are listed; it may differ from the text the list is written into, when
 * the numbers are changing in the same edit.
 */
export function contentsList(headingsFrom: string, settings: NumberingSettings, anchor = DEFAULT_ANCHOR): string {
  const headings = parseHeadings(headingsFrom);
  const first = firstLevelOf(headings, settings);
  const own = new RegExp(`\\s\\^${escape(anchor)}$`);
  return headings
    .filter((h) => h.level >= first && h.level <= settings.maxLevel && h.text.trim() !== '' && !own.test(h.text))
    .map((h) => {
      const target = linkText(h.text);
      const label = h.text.replace(/\|/g, '-').replace(/\]\]/g, ']').trim();
      return `${'\t'.repeat(h.level - first)}- [[#${target}|${label}]]`;
    })
    .join('\n');
}

/**
 * The edit that brings the table of contents in `text` up to date with the
 * headings of `headingsFrom`, or null when the note has none or it is
 * already right. Offsets are in `text`.
 */
export function updateContents(
  text: string,
  headingsFrom: string,
  settings: NumberingSettings,
  anchor = DEFAULT_ANCHOR,
): Edit | null {
  const region = findRegion(text, anchor);
  if (!region) return null;
  const lines = scanLines(text);
  const list = contentsList(headingsFrom, settings, anchor);

  if (region.list) {
    const [from, to] = region.list;
    const start = lines[from].start;
    const end = lines[to].start + lines[to].text.length;
    return text.slice(start, end) === list ? null : { from: start, to: end, insert: list };
  }
  if (list === '') return null;
  const anchorLine = lines[region.anchor];
  const end = anchorLine.start + anchorLine.text.length;
  return { from: end, to: end, insert: '\n' + list };
}

/**
 * A new table of contents to insert at `offset`, with its anchor line: a
 * `Contents` label carrying the block id, then the list.
 */
export function newContents(text: string, settings: NumberingSettings, anchor = DEFAULT_ANCHOR): string {
  const list = contentsList(text, settings, anchor);
  return `**Contents** ^${anchor}\n${list}\n`;
}
