import assert from 'node:assert/strict';
import test from 'node:test';

import { linkKey, retargetLinks } from '../src/links.ts';
import { applyEdits } from '../src/markdown.ts';

const renames = new Map([
  ['Setup', '2.1. Setup'],
  ['Q&A: open points', '3. Q&A: open points'],
]);

/** The renumbered note is `Guide`, reached as `Guide` or `docs/Guide.md`. */
const toGuide = (path: string) => path === 'Guide' || path === 'docs/Guide.md';

function retarget(text: string, isTarget = toGuide): string {
  return applyEdits(text, retargetLinks(text, renames, isTarget));
}

test('rewrites a wikilink to a renamed heading and keeps its alias', () => {
  assert.equal(retarget('See [[Guide#Setup|setting up]].'), 'See [[Guide#2.1. Setup|setting up]].');
});

test('rewrites embeds too', () => {
  assert.equal(retarget('![[Guide#Setup]]'), '![[Guide#2.1. Setup]]');
});

test('matches the way Obsidian writes a heading with unlinkable characters', () => {
  assert.equal(retarget('[[Guide#Q&A open points]]'), '[[Guide#3. Q&A open points]]');
  assert.equal(linkKey('Q&A: open points'), linkKey('q&a open points'));
});

test('rewrites each heading of a nested heading path', () => {
  const nested = new Map([
    ['Method', '2. Method'],
    ['Setup', '2.1. Setup'],
  ]);
  const text = '[[Guide#Method#Setup]]';
  assert.equal(applyEdits(text, retargetLinks(text, nested, toGuide)), '[[Guide#2. Method#2.1. Setup]]');
});

test('rewrites Markdown links, encoded or in angle brackets', () => {
  assert.equal(retarget('[s](docs/Guide.md#Setup)'), '[s](docs/Guide.md#2.1.%20Setup)');
  assert.equal(retarget('[s](<docs/Guide.md#Setup> "t")'), '[s](<docs/Guide.md#2.1. Setup> "t")');
});

test('an encoded link with a space in the path is decoded before it is compared', () => {
  const other = (path: string) => path === 'My Guide.md';
  assert.equal(retarget('[s](My%20Guide.md#Setup)', other), '[s](My%20Guide.md#2.1.%20Setup)');
});

test('links to other notes, block references and web pages are left alone', () => {
  const text = '[[Other#Setup]] [[Guide#^block]] [[Guide]] [w](https://example.com/Guide#Setup)';
  assert.deepEqual(retargetLinks(text, renames, toGuide), []);
});

test('links in code are text, not links', () => {
  const text = '`[[Guide#Setup]]`\n```\n[[Guide#Setup]]\n```\n';
  assert.deepEqual(retargetLinks(text, renames, toGuide), []);
});

test('a link within the note has an empty path', () => {
  const self = (path: string) => path === '';
  assert.equal(retarget('Back to [[#Setup]].', self), 'Back to [[#2.1. Setup]].');
});

test('wikilinks in properties are updated', () => {
  assert.equal(retarget('---\nsee: "[[Guide#Setup]]"\n---\n'), '---\nsee: "[[Guide#2.1. Setup]]"\n---\n');
});

test('a link that already points at the new text is not touched', () => {
  assert.deepEqual(retargetLinks('[[Guide#2.1. Setup]]', renames, toGuide), []);
});

test('headings and the links within the note change together without overlapping', async () => {
  const { DEFAULT_NUMBERING, planNumbering } = await import('../src/numbering.ts');
  const note = '## [[#Setup]] first\n## Setup\nSee [[#Setup]].\n';
  const plan = planNumbering(note, DEFAULT_NUMBERING);
  const edits = [...plan.edits, ...retargetLinks(note, plan.renames, (path) => path === '')];
  assert.equal(applyEdits(note, edits), '## 1. [[#2. Setup]] first\n## 2. Setup\nSee [[#2. Setup]].\n');
});

test('an ampersand in a Markdown link stays encoded', () => {
  const qa = 'Q%26A%20open%20points';
  assert.equal(retarget(`[m](docs/Guide.md#${qa})`), `[m](docs/Guide.md#3.%20${qa})`);
});
