/**
 * Keeping written numbers up to date while you write: which notes take part,
 * when a pass runs, where the caret goes, and which links in other notes are
 * rewritten once you stop. Nothing here touches the app; `main.ts` wires it
 * to the editor.
 *
 * A note takes part when its `number headings` property (or else its folder's
 * rule) has the `auto` part, as Number Headings writes it, or when the global
 * setting is on and the note already carries written numbers. The global
 * setting never adds numbers to a note that had none.
 */

import { splitParts } from './frontmatter.ts';
import type { Edit } from './markdown.ts';
import { parseHeadings, planRemoval } from './numbering.ts';
import type { NumberingSettings } from './numbering.ts';

/** How long typing must pause before the note is renumbered. */
export const AUTO_DELAY = 1500;
/** How long the note must stay untouched before links in other notes follow. */
export const LINK_IDLE = 10000;

/** Whether a `number headings` value (a note's property or a folder rule) has the `auto` part. */
export function hasAutoPart(value: string | null | undefined): boolean {
  if (!value) return false;
  return splitParts(value).some((part) => part.trim().toLowerCase() === 'auto');
}

/**
 * Why a note is kept up to date: `explicit` when its property, or its
 * folder's rule, asks with `auto`; `global` when only the setting does; null
 * when nothing does. A note's own property wins over its folder's rule, as
 * for every other part of the value.
 */
export function autoSource(input: {
  /** The note's `number headings` value, or null (also when properties are not followed). */
  noteValue: string | null;
  /** The value of the folder rule that applies, or null. */
  ruleValue: string | null;
  /** The global "Keep numbers up to date as you write" setting. */
  setting: boolean;
}): 'explicit' | 'global' | null {
  const layer = input.noteValue ?? (input.ruleValue && input.ruleValue.trim() !== '' ? input.ruleValue : null);
  if (hasAutoPart(layer)) return 'explicit';
  return input.setting ? 'global' : null;
}

/** Whether any heading in the numbered range already carries a written number. */
export function hasWrittenNumbers(text: string, settings: NumberingSettings): boolean {
  return planRemoval(text, settings).changed > 0;
}

/** A selection as offsets: `anchor` stays put, `head` is where the caret is. */
export interface OffsetRange {
  anchor: number;
  head: number;
}

function sorted(edits: readonly Edit[]): Edit[] {
  return [...edits].sort((a, b) => a.from - b.from || a.to - b.to);
}

/**
 * True when `pos` sits strictly inside text that an edit replaces, such as
 * the middle of a number being rewritten: moving the caret out of there
 * would fight the user, so the pass waits.
 */
export function insideEdit(pos: number, edits: readonly Edit[]): boolean {
  return edits.some((edit) => edit.to > edit.from && pos > edit.from && pos < edit.to);
}

/**
 * Where an offset ends up once `edits` are applied: text inserted at or
 * before it pushes it on, text after it leaves it alone. A caret right where
 * a number goes in (`## |Method`) lands after the number, so typing carries
 * on in the heading's text. Assumes `insideEdit` is false.
 */
export function mapOffset(pos: number, edits: readonly Edit[]): number {
  let shift = 0;
  for (const edit of sorted(edits)) {
    if (edit.from === edit.to) {
      if (pos < edit.from) break;
      shift += edit.insert.length;
    } else {
      if (pos <= edit.from) break;
      shift += edit.insert.length - (edit.to - edit.from);
    }
  }
  return pos + shift;
}

/** The selections after the edits, or null when one of them is inside an edit and the pass should wait. */
export function mapSelections(selections: readonly OffsetRange[], edits: readonly Edit[]): OffsetRange[] | null {
  if (selections.some((s) => insideEdit(s.anchor, edits) || insideEdit(s.head, edits))) return null;
  return selections.map((s) => ({ anchor: mapOffset(s.anchor, edits), head: mapOffset(s.head, edits) }));
}

/** Zero-based line and column of an offset, as the editor counts them. */
export function lineCh(text: string, offset: number): { line: number; ch: number } {
  const before = text.slice(0, Math.max(0, Math.min(offset, text.length)));
  const line = before.split('\n').length - 1;
  return { line, ch: before.length - (before.lastIndexOf('\n') + 1) };
}

/**
 * Adds one pass's renames to the ones still waiting for other notes. A
 * heading renamed twice keeps its first name and its latest one, so a link
 * written before either pass follows it; a heading that went back to its
 * first name drops out.
 */
export function composeRenames(pending: ReadonlyMap<string, string>, next: ReadonlyMap<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  const current = new Set(pending.values());
  for (const [first, now] of pending) out.set(first, next.get(now) ?? now);
  for (const [old, renamed] of next) if (!current.has(old)) out.set(old, renamed);
  for (const [first, now] of out) if (first === now) out.delete(first);
  return out;
}

/**
 * The renames worth carrying to other notes, given the note's text now: the
 * new name must still be a heading (an undone pass, or a heading you then
 * retyped, leaves nothing to point at) and the old one must be gone (a link
 * to it still works, so it is left alone).
 */
export function liveRenames(pending: ReadonlyMap<string, string>, text: string): Map<string, string> {
  const headings = new Set(parseHeadings(text).map((h) => h.text));
  const out = new Map<string, string>();
  for (const [old, renamed] of pending) if (headings.has(renamed) && !headings.has(old)) out.set(old, renamed);
  return out;
}

/** What a pass did: renumbered (or had nothing to do), or must try again later. */
export type PassResult = 'done' | 'wait';

export interface Timers {
  set(callback: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

/**
 * When passes and link updates run. Each editor (`K`) gets one pass
 * `delay` ms after its last edit. Undo and redo pause it until you type
 * again, so undoing a pass is not redone behind your back. Links for a note
 * (`path`) go out when you leave it or after `idle` ms without an edit.
 */
export class AutoScheduler<K> {
  private passes = new Map<K, unknown>();
  private links = new Map<string, unknown>();
  private timers: Timers;
  private pass: (key: K) => PassResult;
  private flush: (path: string) => void;
  private delay: number;
  private idle: number;

  constructor(
    timers: Timers,
    pass: (key: K) => PassResult,
    flush: (path: string) => void,
    delay = AUTO_DELAY,
    idle = LINK_IDLE,
  ) {
    this.timers = timers;
    this.pass = pass;
    this.flush = flush;
    this.delay = delay;
    this.idle = idle;
  }

  /** A change to the note in `key` that the plugin did not make. */
  edited(key: K, path: string, kind: 'type' | 'history'): void {
    this.cancel(key);
    if (this.links.has(path)) this.linksPending(path);
    if (kind === 'type') this.arm(key);
  }

  /** Whether a pass is waiting for this editor. */
  scheduled(key: K): boolean {
    return this.passes.has(key);
  }

  /** A pass renamed headings in `path`: links elsewhere follow on leaving it or after the idle time. */
  linksPending(path: string): void {
    const handle = this.links.get(path);
    if (handle !== undefined) this.timers.clear(handle);
    this.links.set(path, this.timers.set(() => this.flushNow(path), this.idle));
  }

  /** Paths whose links are waiting. */
  pendingPaths(): string[] {
    return [...this.links.keys()];
  }

  /** The note at `path` was left: its links go out now. */
  left(path: string): void {
    if (this.links.has(path)) this.flushNow(path);
  }

  /** Stops the pass waiting for this editor. */
  cancel(key: K): void {
    const handle = this.passes.get(key);
    if (handle === undefined) return;
    this.timers.clear(handle);
    this.passes.delete(key);
  }

  /** Sends every waiting link update and stops all timers. */
  dispose(): void {
    for (const handle of this.passes.values()) this.timers.clear(handle);
    this.passes.clear();
    for (const path of [...this.links.keys()]) this.flushNow(path);
  }

  private arm(key: K): void {
    this.passes.set(
      key,
      this.timers.set(() => {
        this.passes.delete(key);
        if (this.pass(key) === 'wait') this.arm(key);
      }, this.delay),
    );
  }

  private flushNow(path: string): void {
    const handle = this.links.get(path);
    if (handle !== undefined) this.timers.clear(handle);
    this.links.delete(path);
    this.flush(path);
  }
}
