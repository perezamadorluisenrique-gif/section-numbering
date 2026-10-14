/**
 * Properties that hold for any note, checked on hand-written notes in the
 * style of the Obsidian help vault and on a couple of thousand generated
 * ones with headings at every level.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { linkKey, retargetLinks } from '../src/links.ts';
import { applyEdits } from '../src/markdown.ts';
import { DEFAULT_NUMBERING, parseHeadings, planNumbering, planRemoval } from '../src/numbering.ts';
import type { NumberingSettings } from '../src/numbering.ts';
import { SAMPLES, protectedPieces, randomNote } from './markdown-samples.ts';

/** A generated note with every third line made a heading, and a link to one. */
function withHeadings(seed: number): string {
  const lines = randomNote(seed, 14)
    .split('\n')
    .map((line, i) => (i % 3 === 0 && line !== '---' ? `${'#'.repeat(1 + ((seed * 7 + i) % 4))} ${line.replace(/^#+ /, '')}` : line));
  return [...lines, '', 'See [[#plain words]] and [[#Link to a heading|this]].'].join('\n');
}

const NOTES: [string, string][] = [
  ...Object.entries(SAMPLES),
  ...Array.from({ length: 1500 }, (_, i): [string, string] => [`seed ${i + 1}`, withHeadings(i + 1)]),
];

const SETTINGS: NumberingSettings[] = [
  DEFAULT_NUMBERING,
  { ...DEFAULT_NUMBERING, separator: '' },
  { ...DEFAULT_NUMBERING, topStyle: 'I', otherStyle: 'a', separator: ')' },
  { ...DEFAULT_NUMBERING, separator: ' —', firstLevel: 2, maxLevel: 3 },
  { ...DEFAULT_NUMBERING, topTemplate: 'Chapter {n}:' },
];

const label = (name: string, s: NumberingSettings) => `${name} (${JSON.stringify(s)})`;
const number = (text: string, s: NumberingSettings) => applyEdits(text, planNumbering(text, s).edits);

/** Whether any heading already starts with something that reads as a number. */
const hasNumbers = (text: string) => parseHeadings(text).some((h) => /^(?:\d|[IVXivx]+[.)]|[A-Za-z][.)]|Chapter)/.test(h.text));

/** Code, fenced or inline, which neither numbering nor link updates may touch. */
const code = (text: string) => protectedPieces(text).filter((p) => p.startsWith('`') || /^[ \t>*+\-\d.)]*(```|~~~)/.test(p));

test('numbering a numbered note changes nothing', () => {
  for (const s of SETTINGS) {
    for (const [name, note] of NOTES) {
      const once = number(note, s);
      assert.deepEqual(planNumbering(once, s).edits, [], label(name, s));
    }
  }
});

test('numbering and then removing the numbers gives back the note', () => {
  for (const s of SETTINGS) {
    for (const [name, note] of NOTES) {
      if (hasNumbers(note)) continue;
      const once = number(note, s);
      assert.equal(applyEdits(once, planRemoval(once, s).edits), note, label(name, s));
    }
  }
});

test('only heading lines change, and code is left as it is', () => {
  for (const s of SETTINGS) {
    for (const [name, note] of NOTES) {
      const before = note.split('\n');
      const after = number(note, s).split('\n');
      assert.equal(after.length, before.length, label(name, s));
      before.forEach((line, i) => {
        if (line !== after[i]) assert.match(line, /^ {0,3}#{1,6}[ \t]/, label(name, s));
      });
      assert.deepEqual(code(after.join('\n')), code(note), label(name, s));
    }
  }
});

test('a link to a heading still finds it after renumbering, and links in code stay', () => {
  for (const s of SETTINGS) {
    for (const [name, note] of NOTES) {
      const plan = planNumbering(note, s);
      const numbered = applyEdits(note, plan.edits);
      const linked = applyEdits(numbered, retargetLinks(numbered, plan.renames, (path) => path === ''));
      assert.deepEqual(code(linked), code(note), label(name, s));

      const keys = (text: string) => new Set(parseHeadings(text).map((h) => linkKey(h.text)));
      const targets = (text: string) => [...text.matchAll(/\[\[#([^\]|]+)/g)].map((m) => linkKey(m[1]));
      const [before, after] = [keys(note), keys(linked)];
      const [linksBefore, linksAfter] = [targets(note), targets(linked)];
      linksBefore.forEach((target, i) => {
        if (before.has(target)) assert.ok(after.has(linksAfter[i]), `${label(name, s)}: ${target}`);
      });
    }
  }
});
