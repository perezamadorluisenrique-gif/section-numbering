/**
 * Just enough Markdown structure to know where headings and links can be.
 *
 * Nothing under `src/` imports `obsidian`, so the whole engine runs under
 * plain Node and is unit tested. `main.ts` is the only file that talks to
 * the app.
 */

/** Where a line sits, which decides whether a `#` or a `[[` on it counts. */
export type LineKind = 'frontmatter' | 'code' | 'comment' | 'body';

export interface Line {
  /** Offset of the line's first character in the whole text. */
  start: number;
  /** The line without its terminator, and without a trailing `\r`. */
  text: string;
  kind: LineKind;
}

/** A replacement expressed in offsets of the original text. */
export interface Edit {
  from: number;
  to: number;
  insert: string;
}

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;

/**
 * Splits `text` into lines and classifies each one.
 *
 * Frontmatter only counts when `---` is the very first line. A fence closes
 * on a run of the same character at least as long as the one that opened
 * it, as CommonMark says, so a ```` block can quote a ``` block. `%%` starts
 * and ends an Obsidian comment, which can span lines; a line that holds a
 * whole `%%…%%` comment is still body text.
 */
export function scanLines(text: string): Line[] {
  const lines: Line[] = [];
  let fence: { char: string; length: number } | null = null;
  let inComment = false;
  let frontmatter = false;

  let start = 0;
  let index = 0;
  while (start <= text.length) {
    const newline = text.indexOf('\n', start);
    const end = newline === -1 ? text.length : newline;
    let raw = text.slice(start, end);
    if (raw.endsWith('\r')) raw = raw.slice(0, -1);

    let kind: LineKind;
    if (index === 0 && trimEnd(raw) === '---') {
      frontmatter = true;
      kind = 'frontmatter';
    } else if (frontmatter) {
      kind = 'frontmatter';
      const trimmed = trimEnd(raw);
      if (trimmed === '---' || trimmed === '...') frontmatter = false;
    } else if (fence) {
      kind = 'code';
      const close = /^ {0,3}(`+|~+)[ \t]*$/.exec(raw);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null;
    } else if (inComment) {
      kind = 'comment';
      if (countOf(raw, '%%') % 2 === 1) inComment = false;
    } else {
      const open = FENCE_OPEN.exec(raw);
      // A backtick fence's info string may not contain a backtick; if it
      // does, the line is inline code, not a fence.
      if (open && !(open[1][0] === '`' && raw.slice(open[0].length).includes('`'))) {
        fence = { char: open[1][0], length: open[1].length };
        kind = 'code';
      } else if (countOf(raw, '%%') % 2 === 1) {
        inComment = true;
        kind = 'comment';
      } else {
        kind = 'body';
      }
    }

    lines.push({ start, text: raw, kind });
    if (newline === -1) break;
    start = newline + 1;
    index++;
  }
  return lines;
}

/**
 * `String.prototype.trimEnd` is ES2019 and the plugin targets ES2018, where
 * the type checker has no signature for it.
 */
function trimEnd(s: string): string {
  return s.replace(/\s+$/, '');
}

function countOf(haystack: string, needle: string): number {
  let count = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) {
    count++;
  }
  return count;
}

/**
 * The column ranges of inline code spans on one line, as `[from, to)`.
 *
 * A span opens on a run of backticks and closes on the next run of the same
 * length. An unmatched run is literal text, not code.
 */
export function inlineCodeRanges(line: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const runs: Array<{ at: number; length: number }> = [];
  const pattern = /`+/g;
  for (let m = pattern.exec(line); m; m = pattern.exec(line)) {
    runs.push({ at: m.index, length: m[0].length });
  }
  for (let i = 0; i < runs.length; i++) {
    const opener = runs[i];
    const closer = runs.findIndex((r, j) => j > i && r.length === opener.length);
    if (closer === -1) continue;
    ranges.push([opener.at, runs[closer].at + runs[closer].length]);
    i = closer;
  }
  return ranges;
}

/**
 * Applies edits made against `text`. They must not overlap; an insertion
 * that shares its position with a replacement goes in front of it.
 */
export function applyEdits(text: string, edits: Edit[]): string {
  const sorted = [...edits].sort((a, b) => a.from - b.from || a.to - b.to);
  let out = '';
  let cursor = 0;
  for (const edit of sorted) {
    if (edit.from < cursor) throw new Error(`Overlapping edits at offset ${edit.from}`);
    out += text.slice(cursor, edit.from) + edit.insert;
    cursor = edit.to;
  }
  return out + text.slice(cursor);
}
