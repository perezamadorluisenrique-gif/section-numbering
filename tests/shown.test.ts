import assert from 'node:assert/strict';
import test from 'node:test';

import { liveContentsEntries, parseLiveOptions, headingLink } from '../src/live.ts';
import { applyEdits } from '../src/markdown.ts';
import { DEFAULT_NUMBERING, planNumbering, shownNumbers } from '../src/numbering.ts';

const S = DEFAULT_NUMBERING;

const shown = (text: string, settings = S) => shownNumbers(text, settings).map((n) => n.number + n.heading.text);

test('shows the numbers Number headings would write', () => {
  const note = '# Guide\n## Intro\n### Scope\n## Method\n```\n## code\n```\n## End';
  const written = applyEdits(note, planNumbering(note, S).edits);
  const headings = written.split('\n').filter((l) => /^#+ \S/.test(l) && !l.includes('code'));
  assert.deepEqual(
    shown(note),
    headings.map((l) => l.replace(/^#+ /, '')),
  );
  assert.deepEqual(shown(note), ['1. Guide', '1.1. Intro', '1.1.1. Scope', '1.2. Method', '1.3. End']);
});

test('offsets point at the start of the heading text', () => {
  const note = 'text\n## Alpha\n### Beta';
  for (const { heading } of shownNumbers(note, S)) {
    assert.equal(note.slice(heading.from, heading.to), heading.text);
  }
});

test('draws nothing in a note whose headings already have written numbers', () => {
  assert.deepEqual(shown('## 1. Intro\n## Method'), []);
  assert.deepEqual(shown('## 1. Intro\n## 2. Method'), []);
});

test('a year or a version at the start of a heading is not a written number', () => {
  assert.deepEqual(shown('## 2024 in review\n## 2.0 migration\n## Plans'), [
    '1. 2024 in review',
    '2. 2.0 migration',
    '3. Plans',
  ]);
});

test('skipped headings take no number, and follow the other settings', () => {
  assert.deepEqual(shown('# Title ^skipped\n## A\n## B', S), ['1. A', '2. B']);
  assert.deepEqual(shown('## A\n### B\n#### C', { ...S, maxLevel: 3, topStyle: 'I', separator: ')' }), [
    'I) A',
    'I.1) B',
  ]);
  assert.deepEqual(shown('# Part\n## A\n## B\n# Part 2\n## C', { ...S, firstLevel: 2 }), ['1. A', '2. B', '1. C']);
});

test('live block options', () => {
  assert.deepEqual(parseLiveOptions(''), { depth: null, numbers: true });
  assert.deepEqual(parseLiveOptions('depth: 2\nnumbers: off\nwhatever: x'), { depth: 2, numbers: false });
  assert.deepEqual(parseLiveOptions('depth: 9'), { depth: null, numbers: true });
});

test('live entries list the headings, with shown numbers when they are drawn', () => {
  const note = '# Guide\n```section-contents\n```\n## Intro ^abc\n### Scope\n## Preface ^skipped\n## Method';
  const plain = liveContentsEntries(note, S, parseLiveOptions(''), false);
  assert.deepEqual(
    plain.map((e) => [e.depth, e.label]),
    [[0, 'Guide'], [1, 'Intro'], [2, 'Scope'], [1, 'Method']],
  );
  const numbered = liveContentsEntries(note, S, parseLiveOptions('depth: 2'), true);
  assert.deepEqual(
    numbered.map((e) => e.label),
    ['1. Guide', '1.1. Intro', '1.2. Method'],
  );
  assert.deepEqual(
    liveContentsEntries(note, S, parseLiveOptions('numbers: off'), true).map((e) => e.label)[0],
    'Guide',
  );
  assert.equal(headingLink('Method: how'), '#Method how');
});

test('live entries of a note with written numbers read as the headings do', () => {
  const note = '## 1. Intro\n## 2. Method';
  assert.deepEqual(
    liveContentsEntries(note, S, parseLiveOptions(''), true).map((e) => e.label),
    ['1. Intro', '2. Method'],
  );
});
