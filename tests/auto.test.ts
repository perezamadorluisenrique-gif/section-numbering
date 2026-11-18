import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AutoScheduler,
  autoSource,
  composeRenames,
  hasAutoPart,
  hasWrittenNumbers,
  insideEdit,
  lineCh,
  liveRenames,
  mapOffset,
  mapSelections,
} from '../src/auto.ts';
import type { PassResult, Timers } from '../src/auto.ts';
import { applyEdits } from '../src/markdown.ts';
import { DEFAULT_NUMBERING, planNumbering } from '../src/numbering.ts';

test('hasAutoPart finds auto among the parts, in any case, and nothing else', () => {
  assert.equal(hasAutoPart('auto, first-level 2, max 3, A.1'), true);
  assert.equal(hasAutoPart('first-level 2,AUTO'), true);
  assert.equal(hasAutoPart(' auto '), true);
  assert.equal(hasAutoPart('first-level auto, 1.1.'), false);
  assert.equal(hasAutoPart('template-level-1 "auto, {n}", 1.1'), false);
  assert.equal(hasAutoPart('off'), false);
  assert.equal(hasAutoPart(''), false);
  assert.equal(hasAutoPart(null), false);
});

test('autoSource: the note asks, else its folder rule, else the global setting', () => {
  assert.equal(autoSource({ noteValue: 'auto, 1.1', ruleValue: null, setting: false }), 'explicit');
  assert.equal(autoSource({ noteValue: null, ruleValue: 'auto, A.1', setting: false }), 'explicit');
  assert.equal(autoSource({ noteValue: null, ruleValue: '', setting: false }), null);
  assert.equal(autoSource({ noteValue: null, ruleValue: null, setting: true }), 'global');
  assert.equal(autoSource({ noteValue: null, ruleValue: null, setting: false }), null);
  // The note's own value wins over its folder's rule.
  assert.equal(autoSource({ noteValue: '1.1', ruleValue: 'auto', setting: false }), null);
  assert.equal(autoSource({ noteValue: '1.1', ruleValue: 'auto', setting: true }), 'global');
});

test('hasWrittenNumbers: only numbers in the plugin style count, not a version or a year', () => {
  assert.equal(hasWrittenNumbers('## 1. Intro\n## Method\n', DEFAULT_NUMBERING), true);
  assert.equal(hasWrittenNumbers('## Intro\n## Method\n', DEFAULT_NUMBERING), false);
  assert.equal(hasWrittenNumbers('## 2024 in review\n## 2.0 migration\n## Notes\n', DEFAULT_NUMBERING), false);
  assert.equal(hasWrittenNumbers('', DEFAULT_NUMBERING), false);
});

test('mapOffset: insertions at or before the caret push it on, later ones do not', () => {
  const edits = [
    { from: 3, to: 3, insert: '1. ' },
    { from: 20, to: 22, insert: '10' },
  ];
  assert.equal(mapOffset(0, edits), 0);
  assert.equal(mapOffset(3, edits), 6, 'a caret where the number goes in lands after it');
  assert.equal(mapOffset(10, edits), 13);
  assert.equal(mapOffset(20, edits), 23, 'a caret before replaced text stays in front of it');
  assert.equal(mapOffset(22, edits), 25, 'a caret right after replaced text stays after it');
  assert.equal(mapOffset(30, edits), 33);
});

test('mapOffset: removed and shortened text pulls the caret back', () => {
  const edits = [{ from: 3, to: 9, insert: '' }];
  assert.equal(mapOffset(9, edits), 3);
  assert.equal(mapOffset(15, edits), 9);
  assert.equal(mapOffset(2, edits), 2);
  assert.equal(mapOffset(5, [{ from: 0, to: 4, insert: '9. ' }]), 4);
});

test('mapOffset: edits given out of order are applied in text order', () => {
  const edits = [
    { from: 30, to: 30, insert: 'abc' },
    { from: 3, to: 3, insert: '1. ' },
  ];
  assert.equal(mapOffset(31, edits), 37);
});

test('insideEdit: only strictly inside replaced text, never at its edges or at an insertion', () => {
  const edits = [
    { from: 3, to: 6, insert: '2. ' },
    { from: 10, to: 10, insert: 'x' },
  ];
  assert.equal(insideEdit(3, edits), false);
  assert.equal(insideEdit(4, edits), true);
  assert.equal(insideEdit(5, edits), true);
  assert.equal(insideEdit(6, edits), false);
  assert.equal(insideEdit(10, edits), false);
});

test('mapSelections keeps direction, and waits when a caret is inside a number being rewritten', () => {
  const edits = [{ from: 3, to: 6, insert: '10. ' }];
  assert.deepEqual(mapSelections([{ anchor: 12, head: 8 }], edits), [{ anchor: 13, head: 9 }]);
  assert.equal(mapSelections([{ anchor: 12, head: 8 }, { anchor: 4, head: 4 }], edits), null);
  assert.equal(mapSelections([{ anchor: 0, head: 5 }], edits), null);
  assert.deepEqual(mapSelections([], edits), []);
});

test('typing a heading in the middle: the caret stays at the end of what was typed', () => {
  const before = '## 1. Intro\n## Ne\n## 2. Method\n';
  const caret = before.indexOf('Ne') + 2;
  const plan = planNumbering(before, DEFAULT_NUMBERING);
  const after = applyEdits(before, plan.edits);
  assert.equal(after, '## 1. Intro\n## 2. Ne\n## 3. Method\n');
  const [mapped] = mapSelections([{ anchor: caret, head: caret }], plan.edits) ?? [];
  assert.equal(after.slice(0, mapped.head), '## 1. Intro\n## 2. Ne');
  assert.deepEqual(lineCh(after, mapped.head), { line: 1, ch: 8 });
});

test('a caret in a later heading follows a number that grew longer', () => {
  const lines = Array.from({ length: 9 }, (_, i) => `## ${i + 1}. H${i}`);
  const before = ['## New', ...lines, '## Last'].join('\n');
  const caret = before.length; // end of "## Last"
  const plan = planNumbering(before, DEFAULT_NUMBERING);
  const after = applyEdits(before, plan.edits);
  const [mapped] = mapSelections([{ anchor: caret, head: caret }], plan.edits) ?? [];
  assert.equal(mapped.head, after.length);
  assert.ok(after.endsWith('## 11. Last'));
});

test('lineCh counts lines and columns, and clamps', () => {
  assert.deepEqual(lineCh('ab\ncd', 0), { line: 0, ch: 0 });
  assert.deepEqual(lineCh('ab\ncd', 2), { line: 0, ch: 2 });
  assert.deepEqual(lineCh('ab\ncd', 3), { line: 1, ch: 0 });
  assert.deepEqual(lineCh('ab\ncd', 99), { line: 1, ch: 2 });
  assert.deepEqual(lineCh('', 0), { line: 0, ch: 0 });
});

test('composeRenames follows a heading through several passes and drops a round trip', () => {
  const one = composeRenames(new Map(), new Map([['2. Method', '3. Method']]));
  assert.deepEqual([...one], [['2. Method', '3. Method']]);
  const two = composeRenames(one, new Map([['3. Method', '4. Method'], ['3. Setup', '4. Setup']]));
  assert.deepEqual([...two], [['2. Method', '4. Method'], ['3. Setup', '4. Setup']]);
  const back = composeRenames(two, new Map([['4. Method', '2. Method']]));
  assert.deepEqual([...back], [['3. Setup', '4. Setup']]);
});

test('composeRenames: a first name that is back and renamed again takes the new name', () => {
  const pending = new Map([['2. A', '3. A']]);
  const next = composeRenames(pending, new Map([['2. A', '5. A']]));
  assert.deepEqual([...next], [['2. A', '5. A']]);
});

test('liveRenames keeps only renames whose new heading exists and whose old one is gone', () => {
  const pending = new Map([
    ['2. Method', '3. Method'],
    ['Gone', '9. Gone'],
    ['1. Intro', '1. Introduction'],
  ]);
  const text = '## 1. Intro\n## 2. New\n## 3. Method\n';
  assert.deepEqual([...liveRenames(pending, text)], [['2. Method', '3. Method']]);
  // After undoing the pass, the old names are back and nothing is carried.
  assert.deepEqual([...liveRenames(pending, '## 1. Intro\n## 2. Method\n')], []);
});

/** Timers driven by hand: `tick(ms)` runs what is due, in order. */
function fakeTimers() {
  let now = 0;
  let next = 1;
  const due = new Map<number, { at: number; run: () => void }>();
  const timers: Timers = {
    set(run, ms) {
      const id = next++;
      due.set(id, { at: now + ms, run });
      return id;
    },
    clear(handle) {
      due.delete(handle as number);
    },
  };
  const tick = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const first = [...due.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!first) break;
      due.delete(first[0]);
      now = first[1].at;
      first[1].run();
    }
    now = end;
  };
  return { timers, tick, pending: () => due.size };
}

function scheduler(results: PassResult[] = []) {
  const clock = fakeTimers();
  const passes: string[] = [];
  const flushes: string[] = [];
  const s = new AutoScheduler<string>(
    clock.timers,
    (key) => {
      passes.push(key);
      return results.shift() ?? 'done';
    },
    (path) => flushes.push(path),
    1500,
    10000,
  );
  return { s, clock, passes, flushes };
}

test('scheduler: one pass after typing pauses, never while typing goes on', () => {
  const { s, clock, passes } = scheduler();
  s.edited('ed', 'a.md', 'type');
  clock.tick(1000);
  s.edited('ed', 'a.md', 'type');
  clock.tick(1000);
  s.edited('ed', 'a.md', 'type');
  clock.tick(1499);
  assert.deepEqual(passes, []);
  assert.equal(s.scheduled('ed'), true);
  clock.tick(1);
  assert.deepEqual(passes, ['ed']);
  assert.equal(s.scheduled('ed'), false);
  clock.tick(10000);
  assert.deepEqual(passes, ['ed']);
});

test('scheduler: undo and redo cancel the pass and pause until the next keystroke', () => {
  const { s, clock, passes } = scheduler();
  s.edited('ed', 'a.md', 'type');
  clock.tick(500);
  s.edited('ed', 'a.md', 'history');
  clock.tick(5000);
  assert.deepEqual(passes, []);
  s.edited('ed', 'a.md', 'type');
  clock.tick(1500);
  assert.deepEqual(passes, ['ed']);
});

test('scheduler: a pass that has to wait (composition, caret inside a number) tries again', () => {
  const { s, clock, passes } = scheduler(['wait', 'wait', 'done']);
  s.edited('ed', 'a.md', 'type');
  clock.tick(1500 * 3);
  assert.deepEqual(passes, ['ed', 'ed', 'ed']);
  clock.tick(10000);
  assert.equal(passes.length, 3);
});

test('scheduler: each editor has its own pass', () => {
  const { s, clock, passes } = scheduler();
  s.edited('left', 'a.md', 'type');
  clock.tick(700);
  s.edited('right', 'b.md', 'type');
  clock.tick(800);
  assert.deepEqual(passes, ['left']);
  clock.tick(700);
  assert.deepEqual(passes, ['left', 'right']);
});

test('scheduler: links go out after the idle time, and typing in the note postpones them', () => {
  const { s, clock, flushes } = scheduler();
  s.linksPending('a.md');
  clock.tick(9000);
  s.edited('ed', 'a.md', 'type');
  clock.tick(9000);
  assert.deepEqual(flushes, []);
  // Typing in another note does not postpone them.
  s.edited('other', 'b.md', 'type');
  clock.tick(1000);
  assert.deepEqual(flushes, ['a.md']);
  assert.deepEqual(s.pendingPaths(), []);
});

test('scheduler: leaving the note sends its links at once, and only once', () => {
  const { s, clock, flushes } = scheduler();
  s.linksPending('a.md');
  s.linksPending('a.md');
  s.left('b.md');
  assert.deepEqual(flushes, []);
  s.left('a.md');
  assert.deepEqual(flushes, ['a.md']);
  clock.tick(20000);
  s.left('a.md');
  assert.deepEqual(flushes, ['a.md']);
});

test('scheduler: dispose stops passes and sends what is waiting', () => {
  const { s, clock, passes, flushes } = scheduler();
  s.edited('ed', 'a.md', 'type');
  s.linksPending('b.md');
  s.dispose();
  clock.tick(20000);
  assert.deepEqual(passes, []);
  assert.deepEqual(flushes, ['b.md']);
  assert.equal(clock.pending(), 0);
});
