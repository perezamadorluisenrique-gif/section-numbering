import assert from 'node:assert/strict';
import test from 'node:test';

import { contentsList, updateContents } from '../src/contents.ts';
import { noteSettings, settingsToValue } from '../src/frontmatter.ts';
import { retargetLinks } from '../src/links.ts';
import { applyEdits } from '../src/markdown.ts';
import { DEFAULT_NUMBERING, isSkipped, planNumbering, planRemoval } from '../src/numbering.ts';
import type { NumberingSettings } from '../src/numbering.ts';

const number = (text: string, settings: NumberingSettings = DEFAULT_NUMBERING) =>
  applyEdits(text, planNumbering(text, settings).edits);
const remove = (text: string, settings: NumberingSettings = DEFAULT_NUMBERING) =>
  applyEdits(text, planRemoval(text, settings).edits);

const OUTLINE = [
  '# Alpha',
  '## One',
  '## Skipped one ^skipped',
  '## Two',
  '### Deep',
  '# Beta',
  '',
].join('\n');

test('isSkipped needs the block id at the end, after whitespace', () => {
  assert.equal(isSkipped('Preface ^skipped', 'skipped'), true);
  assert.equal(isSkipped('Preface ^skipped  ', 'skipped'), true);
  assert.equal(isSkipped('^skipped', 'skipped'), true);
  assert.equal(isSkipped('Preface^skipped', 'skipped'), false);
  assert.equal(isSkipped('Preface ^skipped more', 'skipped'), false);
  assert.equal(isSkipped('Preface ^skippedx', 'skipped'), false);
  assert.equal(isSkipped('Preface ^skipped', ''), false);
  assert.equal(isSkipped('Preface ^skipped', undefined), false);
  assert.equal(isSkipped('Preface ^a.b', 'a.b'), true);
  assert.equal(isSkipped('Preface ^axb', 'a.b'), false);
});

test('a skipped heading takes no number and does not consume one', () => {
  assert.equal(
    number(OUTLINE),
    '# 1. Alpha\n## 1.1. One\n## Skipped one ^skipped\n## 1.2. Two\n### 1.2.1. Deep\n# 2. Beta\n',
  );
});

test('subheadings of a skipped heading are numbered, continuing from the heading above', () => {
  const text = '# A\n## B\n### B1\n## Skip ^skipped\n### C\n## D\n';
  assert.equal(number(text), '# 1. A\n## 1.1. B\n### 1.1.1. B1\n## Skip ^skipped\n### 1.1.2. C\n## 1.2. D\n');
});

test('numbering twice gives the same text, and a skipped heading never gets a number', () => {
  for (const separator of ['.', ')', ' —', ''] as const) {
    for (const style of ['1', 'A', 'I'] as const) {
      const settings = { ...DEFAULT_NUMBERING, separator, topStyle: style, otherStyle: style, startAt: 3 };
      const once = number(OUTLINE, settings);
      const twice = number(once, settings);
      assert.equal(twice, once, `${style} ${separator}`);
      assert.match(once, /^## Skipped one \^skipped$/m);
      assert.equal(planNumbering(once, settings).changed, 0);
    }
  }
});

test('start-at and the styles count only the numbered headings', () => {
  const text = '# A\n# B ^skipped\n# C\n## D\n## E ^skipped\n## F\n';
  const s: NumberingSettings = { ...DEFAULT_NUMBERING, topStyle: 'A', otherStyle: 'I', startAt: 3 };
  assert.equal(number(text, s), '# C. A\n# B ^skipped\n# D. C\n## D.I. D\n## E ^skipped\n## D.II. F\n');
  const roman: NumberingSettings = { ...DEFAULT_NUMBERING, topStyle: 'I' };
  assert.equal(number(text, roman), '# I. A\n# B ^skipped\n# II. C\n## II.1. D\n## E ^skipped\n## II.2. F\n');
});

test('removing numbers restores the original, skipped headings included', () => {
  assert.equal(remove(number(OUTLINE)), OUTLINE);
  for (const separator of ['.', '']) {
    const s = { ...DEFAULT_NUMBERING, separator } as NumberingSettings;
    assert.equal(remove(number(OUTLINE, s), s), OUTLINE);
  }
});

test('a number this plugin gave a heading is taken off once it is skipped', () => {
  const numbered = number('# Alpha\n## Preface\n## One\n');
  assert.equal(numbered, '# 1. Alpha\n## 1.1. Preface\n## 1.2. One\n');
  const marked = numbered.replace('Preface', 'Preface ^skipped');
  const plan = planNumbering(marked, DEFAULT_NUMBERING);
  assert.equal(applyEdits(marked, plan.edits), '# 1. Alpha\n## Preface ^skipped\n## 1.1. One\n');
  // The skipped heading's own text changed, and One renumbered.
  assert.equal(plan.renames.get('1.1. Preface ^skipped'), 'Preface ^skipped');
  assert.equal(plan.renames.get('1.2. One'), '1.1. One');
  assert.equal(number(applyEdits(marked, plan.edits)), applyEdits(marked, plan.edits));
});

test('with no separator the number is taken off a skipped heading too', () => {
  const s = { ...DEFAULT_NUMBERING, separator: '' } as NumberingSettings;
  const text = '# 1 Alpha\n## 1.1 Preface ^skipped\n## 1.2 One\n';
  assert.equal(number(text, s), '# 1 Alpha\n## Preface ^skipped\n## 1.1 One\n');
});

test('a skipped heading keeps a bare version or year, and does not stop a note counting as numbered', () => {
  const text = '# 1. Alpha\n## 1.1. One\n## 2.0 migration ^skipped\n## 2024 in review ^skipped\n';
  assert.equal(number(text), text);
  // An unnumbered skipped heading does not stop a Number Headings note being taken over.
  const old = '# 1.0 Alpha\n## 1.1 One\n## Plain ^skipped\n## 1.2 Two\n';
  assert.equal(number(old), '# 1. Alpha\n## 1.1. One\n## Plain ^skipped\n## 1.2. Two\n');
  const kept = '# 1.0 Alpha\n## 2.0 migration ^skipped\n## 1.1 One\n';
  assert.equal(number(kept), '# 1. Alpha\n## 2.0 migration ^skipped\n## 1.1. One\n');
});

test('the anchor survives in every form of the line', () => {
  const text = '# Title ^skipped\n## A\n## Closing ^skipped ##\n## B\n';
  assert.equal(number(text), '# Title ^skipped\n## 1. A\n## Closing ^skipped ##\n## 2. B\n');
  assert.equal(number('# A\r\n## S ^skipped\r\n## B\r\n'), '# 1. A\r\n## S ^skipped\r\n## 1.1. B\r\n');
});

test('a skipped title does not decide the first level', () => {
  const text = '# Title ^skipped\n## A\n## B\n### C\n';
  assert.equal(number(text), '# Title ^skipped\n## 1. A\n## 2. B\n### 2.1. C\n');
});

test('a heading mentioning the anchor mid-line, or in code, is numbered normally', () => {
  const text = '# A ^skippedly\n```\n# B ^skipped\n```\n# C\n';
  assert.equal(number(text), '# 1. A ^skippedly\n```\n# B ^skipped\n```\n# 2. C\n');
});

test('a custom anchor, and none', () => {
  const s = { ...DEFAULT_NUMBERING, skipAnchor: 'nonum' } as NumberingSettings;
  assert.equal(number('# A ^nonum\n# B ^skipped\n', s), '# A ^nonum\n# 1. B ^skipped\n');
  const off = { ...DEFAULT_NUMBERING, skipAnchor: '' } as NumberingSettings;
  assert.equal(number('# A ^skipped\n', off), '# 1. A ^skipped\n');
});

test('a note property sets the anchor for that note', () => {
  const text = '---\nnumber headings: skip ^nonum, 1.1.\n---\n# A ^nonum\n# B\n';
  const own = noteSettings(text);
  assert.ok(own && !own.off);
  assert.equal(own.settings.skipAnchor, 'nonum');
  assert.equal(noteSettings('---\nnumber headings: skip none\n---\n')?.off, false);
  const none = noteSettings('---\nnumber headings: skip none\n---\n');
  assert.ok(none && !none.off && none.settings.skipAnchor === '');
  // A bare `skip` or a malformed id is ignored, as Number Headings does.
  const bad = noteSettings('---\nnumber headings: skip, max 2\n---\n');
  assert.ok(bad && !bad.off && !('skipAnchor' in bad.settings));
  const bad2 = noteSettings('---\nnumber headings: skip skipped\n---\n');
  assert.ok(bad2 && !bad2.off && !('skipAnchor' in bad2.settings));
});

test('links to a skipped heading are not touched, links to renumbered headings are', () => {
  const text = '# Alpha\n## Skipped one ^skipped\n## Two\n';
  const plan = planNumbering(text, DEFAULT_NUMBERING);
  const links = 'See [[Note#Skipped one ^skipped]], [[Note#Skipped one]], [[Note#Two]] and [t](Note#Two).\n';
  const edits = retargetLinks(links, plan.renames, () => true);
  assert.equal(
    applyEdits(links, edits),
    'See [[Note#Skipped one ^skipped]], [[Note#Skipped one]], [[Note#1.1. Two]] and [t](Note#1.1.%20Two).\n',
  );
  assert.ok(!plan.renames.has('Skipped one ^skipped'));
});

test('the table of contents leaves out skipped headings and its own heading', () => {
  const text = '# Alpha\n## Contents ^toc\n## One\n## Hidden ^skipped\n## Two\n';
  const list = contentsList(text, DEFAULT_NUMBERING);
  assert.equal(list, '- [[#Alpha|Alpha]]\n\t- [[#One|One]]\n\t- [[#Two|Two]]');
  assert.ok(!list.includes('Hidden') && !list.includes('Contents'));
});

test('the table of contents honours a custom anchor and a skipped title for indentation', () => {
  const text = '# Title ^skipped\n## Contents ^index\n## A\n### B\n';
  assert.equal(contentsList(text, DEFAULT_NUMBERING, 'index'), '- [[#A|A]]\n\t- [[#B|B]]');
});

test('numbering a note with a table of contents is stable and keeps skipped entries out', () => {
  const text = '# Alpha\n## Contents ^toc\n- [[#stale|stale]]\n## One\n## Hidden ^skipped\n';
  const plan = planNumbering(text, DEFAULT_NUMBERING);
  const numbered = applyEdits(text, plan.edits);
  const edit = updateContents(text, numbered, DEFAULT_NUMBERING);
  assert.ok(edit);
  const full = applyEdits(numbered, [{ ...edit, from: edit.from + shift(plan, edit.from), to: edit.to + shift(plan, edit.to) }]);
  assert.ok(!full.includes('Hidden ^skipped\n- ') && !/\[\[#[^\]]*Hidden/.test(full));
  // Second pass: nothing to do.
  assert.equal(planNumbering(full, DEFAULT_NUMBERING).changed, 0);
  assert.equal(updateContents(full, full, DEFAULT_NUMBERING), null);
});

function shift(plan: { edits: Array<{ from: number; to: number; insert: string }> }, at: number): number {
  return plan.edits.filter((e) => e.to <= at).reduce((n, e) => n + e.insert.length - (e.to - e.from), 0);
}

const roundTrip = (settings: NumberingSettings, contents?: string) => {
  const value = settingsToValue(settings, contents);
  const parsed = noteSettings(`---\nnumber headings: ${value}\n---\n`);
  assert.ok(parsed && !parsed.off, value);
  // Merged over settings that differ in every field, so nothing can pass by coincidence.
  const base: NumberingSettings = {
    firstLevel: 3, maxLevel: 2, topStyle: 'I', otherStyle: 'A', separator: ' -', startAt: 9, skipAnchor: 'other',
  };
  return { ...base, ...parsed.settings };
};

test('saved settings read back exactly', () => {
  const seps = ['.', ')', ':', ' —', ' -', ''] as const;
  const styles = ['1', 'A', 'I', 'a', 'i', '一'] as const;
  for (const firstLevel of ['auto', 1, 2, 6] as const) {
    for (const separator of seps) {
      for (const topStyle of styles) {
        for (const otherStyle of styles) {
          for (const skipAnchor of ['skipped', 'no-num_1', '']) {
            const s: NumberingSettings = {
              firstLevel, maxLevel: 4, topStyle, otherStyle, separator, startAt: 0, skipAnchor,
              topTemplate: '{n}', otherTemplate: '{n}',
            };
            assert.deepEqual(roundTrip(s), s);
          }
        }
      }
    }
  }
  assert.deepEqual(roundTrip(DEFAULT_NUMBERING), { ...DEFAULT_NUMBERING, startAt: 1 });
});

test('the saved value is what we expect, and keeps an existing contents anchor', () => {
  assert.equal(settingsToValue(DEFAULT_NUMBERING), 'first-level auto, max 6, skip ^skipped, start-at 1, 1.1.');
  assert.equal(
    settingsToValue({ ...DEFAULT_NUMBERING, topStyle: 'A', separator: '', skipAnchor: '' }, 'toc'),
    'first-level auto, max 6, contents ^toc, skip none, start-at 1, A.1',
  );
  const s = { ...DEFAULT_NUMBERING, separator: ' —' } as NumberingSettings;
  assert.equal(roundTrip(s, 'index').separator, ' —');
});

test('the saved value numbers a note the same as the settings it came from', () => {
  const s: NumberingSettings = { ...DEFAULT_NUMBERING, topStyle: 'A', otherStyle: 'I', separator: ')', startAt: 2 };
  const own = noteSettings(`---\nnumber headings: ${settingsToValue(s)}\n---\n`);
  assert.ok(own && !own.off);
  const other: NumberingSettings = { ...DEFAULT_NUMBERING, topStyle: '1', separator: '.', skipAnchor: 'zzz' };
  assert.equal(number(OUTLINE, { ...other, ...own.settings }), number(OUTLINE, s));
});
