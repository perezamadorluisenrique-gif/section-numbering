import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_NUMBERING, parseHeadings, shownNumbers } from '../src/numbering.ts';
import type { NumberingSettings } from '../src/numbering.ts';
import { outlineLabels } from '../src/outline.ts';
import type { OutlineHeading } from '../src/outline.ts';

const S = DEFAULT_NUMBERING;

/** The Outline's headings as the metadata cache would list them: every ATX heading, plus any given extra. */
const outlineOf = (text: string): OutlineHeading[] =>
  parseHeadings(text).map((h) => ({ line: h.line, level: h.level, text: h.text }));

const labels = (text: string, settings: NumberingSettings = S, headings = outlineOf(text)) =>
  outlineLabels(headings, shownNumbers(text, settings));

test('every heading gets the number shown in the editor, in outline order', () => {
  assert.deepEqual(labels('# Guide\n## Intro\n### Scope\n## Method\n## End'), [
    '1. ',
    '1.1. ',
    '1.1.1. ',
    '1.2. ',
    '1.3. ',
  ]);
});

test('skipped headings get no number and take none from the count', () => {
  assert.deepEqual(labels('# Title ^skipped\n## A\n## Preface ^skipped\n## B\n### C'), [null, '1. ', null, '2. ', '2.1. ']);
});

test('templates, styles and separators come through as in the editor', () => {
  const settings: NumberingSettings = {
    ...S,
    topStyle: 'I',
    otherStyle: 'a',
    separator: ')',
    topTemplate: 'Chapter {n}.',
    otherTemplate: 'Section {n}',
  };
  assert.deepEqual(labels('## Intro\n### Scope\n## Method', settings), ['Chapter I. ', 'Section I.a) ', 'Chapter II. ']);
});

test('headings deeper than the last numbered level get none', () => {
  assert.deepEqual(labels('## A\n### B\n#### C', { ...S, maxLevel: 3 }), ['1. ', '1.1. ', null]);
});

test('a note with written numbers gets no labels', () => {
  assert.deepEqual(labels('## 1. Intro\n## 2. Method'), [null, null]);
});

test('a setext heading the plugin does not number is left without a label', () => {
  const note = '## Intro\nPart\n====\n## Method';
  const headings: OutlineHeading[] = [
    { line: 0, level: 2, text: 'Intro' },
    { line: 1, level: 1, text: 'Part' },
    { line: 3, level: 2, text: 'Method' },
  ];
  assert.deepEqual(labels(note, S, headings), ['1. ', null, '2. ']);
});

test('an outline a step behind the note gets labels only where line, level and text agree', () => {
  const note = '## Intro\n## Method\n## End';
  const stale: OutlineHeading[] = [
    { line: 0, level: 2, text: 'Intro' },
    { line: 1, level: 3, text: 'Method' },
    { line: 2, level: 2, text: 'Ending' },
    { line: 7, level: 2, text: 'Gone' },
  ];
  assert.deepEqual(labels(note, S, stale), ['1. ', null, null, null]);
});

test('spacing differences between the two readings of a heading do not matter', () => {
  assert.deepEqual(labels('##   Spaced   out  ', S, [{ line: 0, level: 2, text: 'Spaced out' }]), ['1. ']);
});

test('no shown numbers, no labels', () => {
  assert.deepEqual(outlineLabels(outlineOf('## A\n## B'), []), [null, null]);
  assert.deepEqual(outlineLabels([], shownNumbers('## A', S)), []);
});
