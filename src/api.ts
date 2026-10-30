/**
 * The extension API other plugins reach through
 * `app.plugins.getPlugin('section-numbering').api`.
 *
 * It is small on purpose. A plugin can take over the notes it numbers itself
 * (so only one plugin ever writes numbers into a note) and hear when a note
 * is renumbered. Everything else stays private and can be added later without
 * breaking anyone: `apiVersion` only goes up on a breaking change.
 *
 * This file imports nothing, so a plugin can copy the types as they are.
 */

/** Removes what it was returned for. Safe to call more than once, and after Section Numbering unloads. */
export type Disposer = () => void;

/** A note as Section Numbering is about to treat it: its vault path and its current text (the editor's, if open). */
export interface NoteRef {
  readonly path: string;
  readonly text: string;
}

/** Returned by a claim handler: this note is numbered by the extension, not by Section Numbering. */
export interface NoteClaim {
  /** Named in the notice that says why a command left the note alone. Falls back to the claim's id. */
  readonly owner: string;
}

/** Called synchronously and often (on every keystroke while numbers are shown). Keep it cheap, and do not write. */
export type ClaimHandler = (note: NoteRef) => NoteClaim | null;

export interface RenumberedEvent {
  /** The note that changed. */
  readonly path: string;
  /** Its full text right after the edit: the editor's, which may not be on disk yet. */
  readonly text: string;
  readonly kind: 'numbered' | 'removed';
  /** Old heading text to new heading text, in the form links use. A fresh copy. */
  readonly renames: ReadonlyMap<string, string>;
  /** Headings whose text changed; always more than 0. */
  readonly changed: number;
  /** True when links in other notes were already rewritten on disk. Do not rewrite them again. */
  readonly linksUpdated: boolean;
}

export interface SectionNumberingEvents {
  /** After a numbering or removal command changed a note and its links were updated. */
  renumbered: RenumberedEvent;
  /** After the plugin's settings (or its folder rules) changed. */
  'settings-changed': undefined;
}

export interface SectionNumberingApiV1 {
  readonly apiVersion: 1;
  /** Takes notes over. The first registered handler that returns a claim wins. Registering an id again replaces it. */
  claimNotes(id: string, handler: ClaimHandler): Disposer;
  /** Listens for an event. Listeners are not awaited and a failing one affects nobody else. */
  on<E extends keyof SectionNumberingEvents>(
    event: E,
    listener: (payload: SectionNumberingEvents[E]) => void | Promise<void>,
  ): Disposer;
  /** Draws the shown numbers, live contents blocks and the Outline again. Call it after your claims change. */
  redraw(): void;
}

export const API_VERSION = 1;

export interface Extensions {
  claimNotes: SectionNumberingApiV1['claimNotes'];
  on: SectionNumberingApiV1['on'];
  /** The claim on a note, or null. A handler that throws counts as no claim. */
  claimFor(note: NoteRef): NoteClaim | null;
  emit<E extends keyof SectionNumberingEvents>(event: E, payload: SectionNumberingEvents[E]): void;
  /** Drops every claim and listener. Later registrations do nothing. */
  close(): void;
  /** The frozen object other plugins get. */
  api(redraw: () => void): SectionNumberingApiV1;
}

type Listener = (payload: unknown) => void | Promise<void>;

const NO_OP: Disposer = () => {};

/** The registry behind `api`: pure, so it is tested without Obsidian. `log` receives errors extensions throw. */
export function createExtensions(log: (message: string, error: unknown) => void): Extensions {
  const claims = new Map<string, ClaimHandler>();
  const listeners = new Map<string, Set<Listener>>();
  const logged = new Set<string>();
  let closed = false;

  const claimNotes: Extensions['claimNotes'] = (id, handler) => {
    if (typeof id !== 'string' || id === '') throw new TypeError('section-numbering: claimNotes needs a non-empty id');
    if (typeof handler !== 'function') throw new TypeError('section-numbering: claimNotes needs a function');
    if (closed) return NO_OP;
    claims.set(id, handler);
    return () => {
      if (claims.get(id) === handler) claims.delete(id);
    };
  };

  const on: Extensions['on'] = (event, listener) => {
    if (typeof listener !== 'function') throw new TypeError('section-numbering: on needs a function');
    if (closed) return NO_OP;
    let set = listeners.get(event);
    if (!set) listeners.set(event, (set = new Set()));
    const entry = listener;
    set.add(entry);
    return () => {
      listeners.get(event)?.delete(entry);
    };
  };

  const claimFor: Extensions['claimFor'] = (note) => {
    for (const [id, handler] of claims) {
      let claim: NoteClaim | null | undefined;
      try {
        claim = handler(note);
      } catch (error) {
        if (!logged.has(id)) {
          logged.add(id);
          log(`section-numbering: extension "${id}" failed while claiming a note`, error);
        }
        continue;
      }
      if (claim !== null && claim !== undefined) {
        const owner = (claim as Partial<NoteClaim>).owner;
        return { owner: typeof owner === 'string' && owner !== '' ? owner : id };
      }
    }
    return null;
  };

  const emit: Extensions['emit'] = (event, payload) => {
    for (const listener of [...(listeners.get(event) ?? [])]) {
      const failed = (error: unknown) => log(`section-numbering: a "${event}" listener failed`, error);
      try {
        const result = listener(payload);
        if (result && typeof result.then === 'function') result.then(undefined, failed);
      } catch (error) {
        failed(error);
      }
    }
  };

  return {
    claimNotes,
    on,
    claimFor,
    emit,
    close() {
      closed = true;
      claims.clear();
      listeners.clear();
    },
    api: (redraw) => Object.freeze({ apiVersion: API_VERSION, claimNotes, on, redraw }),
  };
}
