/**
 * Tells the plugin when a note's text changed in an editor, so it can keep
 * written numbers up to date once typing pauses. Changes the plugin makes
 * itself are not reported; undo and redo are reported apart, so a pass the
 * user just undid is not made again until they type.
 */

import { EditorView } from '@codemirror/view';

/** The user event the plugin's own automatic passes carry. */
export const AUTO_USER_EVENT = 'section-numbering.auto';

export function autoNumberingListener(changed: (view: EditorView, kind: 'type' | 'history') => void) {
  return EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;
    const edits = update.transactions.filter((tr) => tr.docChanged && !tr.isUserEvent(AUTO_USER_EVENT));
    if (edits.length === 0) return;
    const history = edits.some((tr) => tr.isUserEvent('undo') || tr.isUserEvent('redo'));
    changed(update.view, history ? 'history' : 'type');
  });
}

/** True while an input method is composing text: the note is not touched then. */
export function isComposing(view: EditorView): boolean {
  return view.composing || view.compositionStarted;
}
