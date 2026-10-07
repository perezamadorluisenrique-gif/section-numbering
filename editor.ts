/**
 * Shown numbers in the editor: a widget in front of each heading's text, in
 * Live Preview and in source mode. The note's text is never changed.
 */

import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';

import type { ShownNumber } from './src/numbering.ts';

export const NUMBER_CLASS = 'section-numbering-number';

class NumberWidget extends WidgetType {
  constructor(private readonly number: string) {
    super();
  }

  eq(other: NumberWidget): boolean {
    return other.number === this.number;
  }

  toDOM(): HTMLElement {
    return createSpan({ cls: NUMBER_CLASS, text: this.number, attr: { 'aria-hidden': 'true' } });
  }
}

/**
 * `numbersFor` gives the numbers to show for a note's text, or none when
 * showing is off or the note asks to be left alone. `version` changes when
 * the settings do; the plugin then calls `workspace.updateOptions()`, which
 * reaches every editor, and the numbers are worked out again.
 */
export function shownNumbersExtension(numbersFor: (text: string) => ShownNumber[], version: () => number) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private seen: number;

      constructor(view: EditorView) {
        this.seen = version();
        this.decorations = this.build(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || this.seen !== version()) {
          this.seen = version();
          this.decorations = this.build(update.view);
        }
      }

      build(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const length = view.state.doc.length;
        for (const { heading, number } of numbersFor(view.state.doc.toString())) {
          if (heading.from > length) break;
          builder.add(heading.from, heading.from, Decoration.widget({ widget: new NumberWidget(number), side: -1 }));
        }
        return builder.finish();
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}
