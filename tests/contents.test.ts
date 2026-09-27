import assert from 'node:assert/strict';
import test from 'node:test';

import { contentsList, hasContents, newContents, updateContents } from '../src/contents.ts';
import { contentsAnchor } from '../src/frontmatter.ts';
import { applyEdits } from '../src/markdown.ts';
import { DEFAULT_NUMBERING, planNumbering } from '../src/numbering.ts';

const S = DEFAULT_NUMBERING;

const NOTE = [
  '# Title',
  '',
  '**Contents** ^toc',
  '- [[#Old|Old]]',
  '',
  '## Intro',
  '### Scope',
  '## Method: how',
  '```',
  '## not a heading',
  '```',
].join('\n');

test('lists headings in range, indented, with link-safe targets', () => {
  assert.equal(
    contentsList('## A\n### B\n#### C\n## D | E', { ...S, firstLevel: 2, maxLevel: 3 }),
    '- [[#A|A]]\n\t- [[#B|B]]\n- [[#D E|D - E]]',
  );
});

test('replaces the old list after the anchor', () => {
  const edit = updateContents(NOTE, NOTE, { ...S, firstLevel: 2 });
  assert.ok(edit);
  const out = applyEdits(NOTE, [edit]);
  assert.equal(
    out.split('\n').slice(2, 7).join('\n'),
    '**Contents** ^toc\n- [[#Intro|Intro]]\n\t- [[#Scope|Scope]]\n- [[#Method how|Method: how]]\n',
  );
  assert.equal(updateContents(out, out, { ...S, firstLevel: 2 }), null);
});

test('follows the numbers when numbering in the same edit', () => {
  const settings = { ...S, firstLevel: 2 as const };
  const plan = planNumbering(NOTE, settings);
  const numbered = applyEdits(NOTE, plan.edits);
  const edit = updateContents(NOTE, numbered, settings);
  assert.ok(edit);
  const out = applyEdits(NOTE, [...plan.edits, edit]);
  assert.match(out, /- \[\[#1\. Intro\|1\. Intro\]\]\n\t- \[\[#1\.1\. Scope\|1\.1\. Scope\]\]\n- \[\[#2\. Method how\|2\. Method: how\]\]/);
  assert.match(out, /## 1\. Intro/);
});

test('fills an anchor with no list yet', () => {
  const text = '## Contents ^toc\n\n## A\n## B';
  const out = applyEdits(text, [updateContents(text, text, S)!]);
  assert.equal(out, '## Contents ^toc\n- [[#A|A]]\n- [[#B|B]]\n\n## A\n## B');
});

test('no anchor, no edit; a new one can be inserted', () => {
  assert.equal(updateContents('## A', '## A', S), null);
  assert.equal(hasContents('## A'), false);
  assert.equal(newContents('## A\n## B', S), '**Contents** ^toc\n- [[#A|A]]\n- [[#B|B]]\n');
});

test('front matter can name another anchor', () => {
  const text = '---\nnumber headings: auto, contents ^index, 1.1\n---\nText ^index\n## A';
  assert.equal(contentsAnchor(text), 'index');
  assert.equal(contentsAnchor('---\nnumber headings: auto\n---\n'), null);
  const out = applyEdits(text, [updateContents(text, text, S, 'index')!]);
  assert.equal(out.split('\n').slice(3, 5).join('\n'), 'Text ^index\n- [[#A|A]]');
});
