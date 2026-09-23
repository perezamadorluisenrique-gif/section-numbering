import assert from 'node:assert/strict';
import test from 'node:test';

import { applyEdits } from '../src/markdown.ts';
import {
  DEFAULT_NUMBERING,
  existingPrefixLength,
  formatNumber,
  numberPrefixPattern,
  parseHeadings,
  planNumbering,
  planRemoval,
} from '../src/numbering.ts';
import type { NumberingSettings } from '../src/numbering.ts';

function numbered(text: string, settings: Partial<NumberingSettings> = {}): string {
  return applyEdits(text, planNumbering(text, { ...DEFAULT_NUMBERING, ...settings }).edits);
}

function removed(text: string, settings: Partial<NumberingSettings> = {}): string {
  return applyEdits(text, planRemoval(text, { ...DEFAULT_NUMBERING, ...settings }).edits);
}

test('numbers an outline from the shallowest level in the note', () => {
  const note = ['## Intro', 'text', '### Scope', '### Terms', '## Method', '### Setup'].join('\n');
  assert.equal(
    numbered(note),
    ['## 1. Intro', 'text', '### 1.1. Scope', '### 1.2. Terms', '## 2. Method', '### 2.1. Setup'].join('\n'),
  );
});

test('numbering twice changes nothing the second time', () => {
  const once = numbered('# A\n## B\n## C\n# D\n');
  const plan = planNumbering(once, DEFAULT_NUMBERING);
  assert.deepEqual(plan.edits, []);
  assert.equal(plan.changed, 0);
});

test('renumbers after a section is moved', () => {
  assert.equal(numbered('## 2. Method\n## 1. Intro\n'), '## 1. Method\n## 2. Intro\n');
});

test('renumbers a heading that changed level instead of numbering it twice', () => {
  assert.equal(numbered('## 1. Intro\n## 1.1. Scope\n'), '## 1. Intro\n## 2. Scope\n');
});

test('picks up numbers written with another separator', () => {
  assert.equal(numbered('## 1) Intro\n### 1.1 Scope\n'), '## 1. Intro\n### 1.1. Scope\n');
});

test('a heading that merely starts with a number keeps it', () => {
  assert.equal(numbered('## 2024 in review\n## 3 things\n'), '## 1. 2024 in review\n## 2. 3 things\n');
});

test('with no separator a lone number is read as a number', () => {
  assert.equal(numbered('## 7 Intro\n## Next\n', { separator: '' }), '## 1 Intro\n## 2 Next\n');
});

test('a skipped level counts as zero', () => {
  assert.equal(numbered('# A\n### B\n## C\n'), '# 1. A\n### 1.0.1. B\n## 1.1. C\n');
});

test('with a fixed first level, shallower headings restart the count', () => {
  const note = '# Part one\n## Intro\n## Body\n# Part two\n## Intro\n';
  assert.equal(
    numbered(note, { firstLevel: 2 }),
    '# Part one\n## 1. Intro\n## 2. Body\n# Part two\n## 1. Intro\n',
  );
});

test('headings deeper than the maximum level are left alone', () => {
  assert.equal(numbered('# A\n## B\n### C\n', { maxLevel: 2 }), '# 1. A\n## 1.1. B\n### C\n');
});

test('letters and Roman numerals', () => {
  assert.equal(
    numbered('# A\n## B\n## C\n# D\n', { topStyle: 'I', otherStyle: 'A' }),
    '# I. A\n## I.A. B\n## I.B. C\n# II. D\n',
  );
  assert.equal(formatNumber(27, 'A'), 'AA');
  assert.equal(formatNumber(1994, 'I'), 'MCMXCIV');
});

test('Roman numbers are renumbered, not stacked', () => {
  const settings = { topStyle: 'I' as const };
  assert.equal(numbered('## IV. Intro\n## Next\n', settings), '## I. Intro\n## II. Next\n');
});

test('the edit touches only the number, so the rest of the line is not rewritten', () => {
  const plan = planNumbering('## 3. Intro\n', DEFAULT_NUMBERING);
  assert.deepEqual(plan.edits, [{ from: 3, to: 6, insert: '1. ' }]);
});

test('ignores code blocks, comments, frontmatter and tags', () => {
  const note = [
    '---',
    'title: x',
    '---',
    '# Real',
    '```md',
    '# In code',
    '```',
    '~~~~',
    '```',
    '# Still code',
    '~~~~',
    '%%',
    '# In a comment',
    '%%',
    '#tag is not a heading',
    '# Also real %%with a comment%%',
  ].join('\n');
  assert.deepEqual(
    parseHeadings(note).map((h) => h.text),
    ['Real', 'Also real %%with a comment%%'],
  );
});

test('closing hashes are not part of the heading text', () => {
  assert.deepEqual(
    parseHeadings('## Title ##\n## C#\n## #\n').map((h) => h.text),
    ['Title', 'C#', ''],
  );
});

test('empty headings are skipped and do not take a number', () => {
  assert.equal(numbered('## A\n##\n## B\n'), '## 1. A\n##\n## 2. B\n');
});

test('Windows line endings survive', () => {
  assert.equal(numbered('## A\r\n## B\r\n'), '## 1. A\r\n## 2. B\r\n');
});

test('removal takes off only numbers', () => {
  assert.equal(removed('## 1. Intro\n### 1.1. Scope\n## 2024 in review\n'), '## Intro\n### Scope\n## 2024 in review\n');
});

test('removal leaves a heading that is only a number', () => {
  assert.equal(removed('## 1.\n'), '## 1.\n');
});

test('renames record the first heading of a shared name', () => {
  const plan = planNumbering('## Summary\n## Other\n## Summary\n', DEFAULT_NUMBERING);
  assert.equal(plan.renames.get('Summary'), '1. Summary');
  assert.equal(plan.changed, 3);
});

test('the prefix pattern never matches an empty prefix', () => {
  const pattern = numberPrefixPattern({ ...DEFAULT_NUMBERING, topStyle: 'I', separator: '' });
  assert.equal(existingPrefixLength('Intro', pattern), 0);
  assert.equal(existingPrefixLength('. Intro', pattern), 0);
  assert.equal(existingPrefixLength('IV Intro', pattern), 3);
});

test('takes over notes numbered by the original plugin', () => {
  const original = '# 1 Introduction\n## 1.1 Scope\n# 2 Method\n';
  // Its dotted numbers are recognised whatever the separator.
  assert.equal(numbered('## 1.1 Scope\n'), '## 1. Scope\n');
  // Its lone top-level numbers need the separator set to none, as it was.
  assert.equal(numbered(original, { separator: '' }), original);
  assert.equal(removed(original, { separator: '' }), '# Introduction\n## Scope\n# Method\n');
});
