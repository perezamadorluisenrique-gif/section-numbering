/**
 * Rewriting links that point at a heading whose text just changed.
 *
 * A link to a heading names the heading by its text, so numbering a note
 * silently breaks every `[[Note#Setup]]` that points into it. This is the
 * part the original Number Headings plugin never did.
 */

import { inlineCodeRanges, scanLines } from './markdown.ts';
import type { Edit } from './markdown.ts';

/**
 * The characters Obsidian will not keep in a link to a heading. When it
 * writes such a link it puts a space where each of them was.
 */
const UNLINKABLE = /[#|^:%[\]\\]/g;

/** A heading's text reduced to the form links are compared in. */
export function linkKey(text: string): string {
  return text.replace(UNLINKABLE, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** A heading's text as it should appear inside a link. */
export function linkText(text: string): string {
  return text.replace(UNLINKABLE, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Decides whether a link path points at the renumbered note. It receives
 * the path exactly as written, decoded, and without the `#` part; an empty
 * path is a link within the note that holds it.
 */
export type IsTarget = (path: string) => boolean;

// `[[path#sub|alias]]`, `![[…]]` alike. The alias may not hold `]]`.
const WIKILINK = /!?\[\[([^[\]|\n]*)(\|[^\n]*?)?\]\]/g;
// `[text](dest)` and `[text](<dest with spaces>)`, with an optional title.
const MDLINK = /!?\[((?:[^\]\n\\]|\\.)*)\]\((<[^>\n]*>|[^)\s]*)((?:\s+"[^"\n]*")?\s*)\)/g;

function keyed(renames: Map<string, string>): Map<string, string> {
  const byKey = new Map<string, string>();
  for (const [from, to] of renames) {
    const key = linkKey(from);
    if (key !== '' && !byKey.has(key)) byKey.set(key, linkText(to));
  }
  return byKey;
}

/**
 * Replaces each heading in a `#`-separated subpath that was renamed.
 * Returns null when nothing changed. Block references (`^id`) are never
 * headings and pass through.
 */
function retargetSubpath(subpath: string, byKey: Map<string, string>): string | null {
  let changed = false;
  const parts = subpath.split('#').map((part) => {
    if (part.startsWith('^')) return part;
    const next = byKey.get(linkKey(part));
    if (next === undefined || next === part) return part;
    changed = true;
    return next;
  });
  return changed ? parts.join('#') : null;
}

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Encodes one heading for a Markdown link destination. Every character a
 * URL could read as structure is escaped, `&` included, so `Q&A` comes out
 * as the `Q%26A` a hand-written link would use.
 */
function encodeHeading(s: string): string {
  return encodeURIComponent(s).replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function rewriteWikilink(match: RegExpExecArray, byKey: Map<string, string>, isTarget: IsTarget): string | null {
  const target = match[1];
  const hash = target.indexOf('#');
  if (hash === -1) return null;
  const path = target.slice(0, hash).trim();
  if (!isTarget(path)) return null;
  const subpath = retargetSubpath(target.slice(hash + 1), byKey);
  if (subpath === null) return null;
  const embed = match[0].startsWith('!') ? '!' : '';
  return `${embed}[[${target.slice(0, hash)}#${subpath}${match[2] ?? ''}]]`;
}

function rewriteMarkdownLink(match: RegExpExecArray, byKey: Map<string, string>, isTarget: IsTarget): string | null {
  let dest = match[2];
  const angled = dest.startsWith('<');
  if (angled) dest = dest.slice(1, -1);
  // Only links into the vault; a web address with a fragment is not ours.
  if (/^[a-z][a-z0-9+.-]*:/i.test(dest)) return null;
  const hash = dest.indexOf('#');
  if (hash === -1) return null;
  const path = decode(dest.slice(0, hash));
  if (!isTarget(path)) return null;
  const subpath = retargetSubpath(decode(dest.slice(hash + 1)), byKey);
  if (subpath === null) return null;
  const encoded = angled ? subpath : subpath.split('#').map(encodeHeading).join('#');
  const next = `${dest.slice(0, hash)}#${encoded}`;
  const embed = match[0].startsWith('!') ? '!' : '';
  return `${embed}[${match[1]}](${angled ? `<${next}>` : next}${match[3]})`;
}

/**
 * The edits that point every link to a renamed heading of the target note
 * at its new text.
 *
 * Links inside code, fenced or inline, are left as they are: they are not
 * links, they are text about links. Frontmatter is searched for wikilinks,
 * since properties can hold them, but not for Markdown links, which it
 * cannot.
 */
export function retargetLinks(text: string, renames: Map<string, string>, isTarget: IsTarget): Edit[] {
  const byKey = keyed(renames);
  if (byKey.size === 0) return [];
  const edits: Edit[] = [];

  for (const line of scanLines(text)) {
    if (line.kind === 'code') continue;
    const code = line.kind === 'frontmatter' ? [] : inlineCodeRanges(line.text);
    const inCode = (at: number) => code.some(([from, to]) => at >= from && at < to);

    const patterns: Array<[RegExp, typeof rewriteWikilink]> = [[WIKILINK, rewriteWikilink]];
    if (line.kind !== 'frontmatter') patterns.push([MDLINK, rewriteMarkdownLink]);

    for (const [source, rewrite] of patterns) {
      const pattern = new RegExp(source.source, 'g');
      for (let match = pattern.exec(line.text); match; match = pattern.exec(line.text)) {
        if (inCode(match.index)) continue;
        const next = rewrite(match, byKey, isTarget);
        if (next === null) continue;
        edits.push({ from: line.start + match.index, to: line.start + match.index + match[0].length, insert: next });
      }
    }
  }
  return edits;
}
