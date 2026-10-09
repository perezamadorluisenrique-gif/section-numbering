/**
 * Shown numbers in the core Outline pane. The pane lists the headings that
 * Obsidian's metadata cache found in a note; each of them is matched to the
 * heading the plugin parsed on the same line, and takes the number drawn in
 * front of that heading in the editor. Nothing here touches the note.
 */

import type { ShownNumber } from './numbering.ts';

/** A heading as the Outline pane has it, from the metadata cache. */
export interface OutlineHeading {
  /** Zero-based line the heading starts on. */
  line: number;
  level: number;
  /** The heading's text, as the metadata cache reads it. */
  text: string;
}

/** Whitespace is the only difference allowed between the two readings of a heading. */
function sameText(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  return norm(a) === norm(b);
}

/**
 * The label for each Outline heading, in the order given: the shown number
 * (with its template and separator, as `1.2. `), or null for a heading that
 * gets none.
 *
 * A heading gets a number only when the plugin parsed a heading on the same
 * line, at the same level and with the same text. Anything else, such as an
 * underlined (setext) heading the plugin does not number, a skipped
 * heading, or an Outline that is a step behind the note, gets null, so a
 * number never lands on the wrong heading.
 */
export function outlineLabels(headings: readonly OutlineHeading[], shown: readonly ShownNumber[]): Array<string | null> {
  const byLine = new Map<number, ShownNumber>();
  for (const n of shown) byLine.set(n.heading.line, n);
  return headings.map((h) => {
    const n = byLine.get(h.line);
    if (!n || n.heading.level !== h.level || !sameText(n.heading.text, h.text)) return null;
    return n.number;
  });
}
