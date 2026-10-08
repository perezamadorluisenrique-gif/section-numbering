import assert from 'node:assert/strict';
import test from 'node:test';

import { contentsList, updateContents } from '../src/contents.ts';
import { mergeNoteSettings, noteSettings, settingsToValue } from '../src/frontmatter.ts';
import { retargetLinks } from '../src/links.ts';
import { liveContentsEntries } from '../src/live.ts';
import { applyEdits } from '../src/markdown.ts';
import {
  DEFAULT_NUMBERING,
  NUMBER_STYLES,
  SEPARATORS,
  chineseNumeral,
  formatNumber,
  isValidTemplate,
  parseTemplate,
  planNumbering,
  planRemoval,
  rememberTemplates,
  shownNumbers,
} from '../src/numbering.ts';
import type { NumberStyle, NumberingSettings } from '../src/numbering.ts';

const numbered = (text: string, s: Partial<NumberingSettings> = {}) =>
  applyEdits(text, planNumbering(text, { ...DEFAULT_NUMBERING, ...s }).edits);
const removed = (text: string, s: Partial<NumberingSettings> = {}) =>
  applyEdits(text, planRemoval(text, { ...DEFAULT_NUMBERING, ...s }).edits);

const OUTLINE = '# Guide\n## Intro\n### Scope\n### Terms\n## Method\n# Next\n## Part\n';
const CHAPTER: Partial<NumberingSettings> = { topTemplate: 'Chapter {n}.', otherTemplate: '{n}' };

test('the plain template changes nothing', () => {
  assert.equal(numbered(OUTLINE), numbered(OUTLINE, { topTemplate: '{n}', otherTemplate: '{n}' }));
  assert.equal(numbered(OUTLINE, { topTemplate: undefined, otherTemplate: undefined }), numbered(OUTLINE));
  assert.equal(numbered('# A\n## B\n', { topTemplate: 'no number here' }), '# 1. A\n## 1.1. B\n');
  assert.equal(numbered('# A\n', { topTemplate: '{n}{n}' }), '# 1. A\n');
});

test('templates are split at {n}', () => {
  assert.deepEqual(parseTemplate('Chapter {n}.'), { prefix: 'Chapter ', suffix: '.' });
  assert.deepEqual(parseTemplate(' Section {n} '), { prefix: 'Section ', suffix: '' });
  assert.deepEqual(parseTemplate('第{n}章'), { prefix: '第', suffix: '章' });
  assert.deepEqual(parseTemplate('{n} —'), { prefix: '', suffix: ' —' });
  assert.deepEqual(parseTemplate('nothing'), { prefix: '', suffix: '' });
  assert.deepEqual(parseTemplate(undefined), { prefix: '', suffix: '' });
  assert.ok(isValidTemplate('a{n}b'));
  assert.ok(!isValidTemplate('a{n}b{n}'));
  assert.ok(!isValidTemplate('abc'));
});

test('writes the template around the number', () => {
  assert.equal(
    numbered(OUTLINE, CHAPTER),
    '# Chapter 1. Guide\n## 1.1. Intro\n### 1.1.1. Scope\n### 1.1.2. Terms\n## 1.2. Method\n# Chapter 2. Next\n## 2.1. Part\n',
  );
  // A suffix replaces the separator; no suffix leaves the separator in place.
  assert.equal(numbered('# A\n## B\n', { topTemplate: 'Chapter {n}', separator: ':' }), '# Chapter 1: A\n## 1.1: B\n');
  assert.equal(numbered('# A\n## B\n', { otherTemplate: 'Section {n}', separator: '' }), '# 1 A\n## Section 1.1 B\n');
  assert.equal(numbered('# A\n## B\n', { topTemplate: '第{n}章', topStyle: '一', separator: '.' }), '# 第一章 A\n## 一.1. B\n');
  assert.equal(numbered('# A\n## B\n', { topTemplate: '{n} —', separator: '.' }), '# 1 — A\n## 1.1. B\n');
});

test('lower levels take their own template', () => {
  assert.equal(
    numbered('# A\n## B\n### C\n', { topTemplate: 'Part {n}', otherTemplate: 'Section {n}:' }),
    '# Part 1. A\n## Section 1.1: B\n### Section 1.1.1: C\n',
  );
  // With the first level set to 2, the top template belongs to the first numbered level.
  assert.equal(
    numbered('# T\n## A\n### B\n', { firstLevel: 2, topTemplate: 'Part {n}', otherTemplate: 'Sec {n}.' }),
    '# T\n## Part 1. A\n### Sec 1.1. B\n',
  );
});

const SEPS = [...SEPARATORS];
const TEMPLATES = ['{n}', 'Chapter {n}.', 'Chapter {n}', 'Part {n}:', '§{n}', '{n}th', '{n} —', '第{n}章', '({n})', 'Sec. {n})', 'A {n} b'];
const NOTES = [
  '# Guide\n## Intro\n### Scope\n## Method\n# Next\n## Part\n',
  '## Intro\n### Scope\n#### Deep\n## Method\n',
  '# Alpha\ntext\n## Beta\n```\n## code\n```\n### Gamma ^skipped\n### Delta\n',
  '## 2024 in review\n## Q&A: open points\n',
];

test('numbering twice never changes anything, for every template, style and separator', () => {
  for (const top of TEMPLATES) {
    for (const other of TEMPLATES) {
      for (const separator of SEPS) {
        for (const topStyle of NUMBER_STYLES) {
          const otherStyle: NumberStyle = topStyle === '1' ? 'a' : '1';
          const s = { topTemplate: top, otherTemplate: other, separator, topStyle, otherStyle };
          for (const note of NOTES) {
            const once = numbered(note, s);
            const plan = planNumbering(once, { ...DEFAULT_NUMBERING, ...s });
            assert.deepEqual(plan.edits, [], JSON.stringify({ s, note, once }));
            assert.equal(plan.changed, 0);
          }
        }
      }
    }
  }
});

test('removing numbers strips the template text, for every template, style and separator', () => {
  for (const top of TEMPLATES) {
    for (const other of TEMPLATES) {
      for (const separator of SEPS) {
        for (const topStyle of NUMBER_STYLES) {
          const s = { topTemplate: top, otherTemplate: other, separator, topStyle, otherStyle: topStyle };
          for (const note of NOTES.slice(0, 3)) {
            assert.equal(removed(numbered(note, s), s), note, JSON.stringify({ s, note }));
          }
        }
      }
    }
  }
});

test('Chapter 1. Intro never becomes Chapter 1. Chapter 1. Intro', () => {
  const text = '## Chapter 1. Intro\n### 1.1. Scope\n## Chapter 2. Method\n';
  assert.deepEqual(planNumbering(text, { ...DEFAULT_NUMBERING, ...CHAPTER }).edits, []);
  assert.equal(
    numbered('## Chapter 2. Intro\n## Chapter 1. Method\n', CHAPTER),
    '## Chapter 1. Intro\n## Chapter 2. Method\n',
  );
  assert.equal(removed(text, CHAPTER), '## Intro\n### Scope\n## Method\n');
});

test('changing the template replaces the old text when it is known', () => {
  const old = numbered(OUTLINE, CHAPTER);
  const next = { topTemplate: 'Part {n}:', otherTemplate: '{n}', knownTemplates: ['Chapter {n}.'] };
  assert.equal(
    numbered(old, next),
    '# Part 1: Guide\n## 1.1. Intro\n### 1.1.1. Scope\n### 1.1.2. Terms\n## 1.2. Method\n# Part 2: Next\n## 2.1. Part\n',
  );
  assert.equal(removed(old, next), OUTLINE);
  // Back to the plain number: the old template is still known.
  assert.equal(numbered(old, { knownTemplates: ['Chapter {n}.'] }), numbered(OUTLINE));
  assert.equal(numbered(old, { knownTemplates: ['Chapter {n}.'], separator: ')' }), numbered(OUTLINE, { separator: ')' }));
});

test('every configured template is recognised, even for the other level', () => {
  const s = { topTemplate: 'Chapter {n}.', otherTemplate: 'Sec {n}:' };
  const once = numbered('# A\n## B\n', s);
  assert.equal(once, '# Chapter 1. A\n## Sec 1.1: B\n');
  // Swapped templates still recognise what the other one wrote.
  const swapped = { topTemplate: 'Sec {n}:', otherTemplate: 'Chapter {n}.' };
  assert.equal(numbered(once, swapped), '# Sec 1: A\n## Chapter 1.1. B\n');
});

test('a template with text before the number does not eat ordinary headings', () => {
  assert.equal(numbered('## Chapter two of the story\n', CHAPTER), '## Chapter 1. Chapter two of the story\n');
  assert.equal(numbered('## 2024 in review\n', CHAPTER), '## Chapter 1. 2024 in review\n');
  // Without the dot the lone number is not taken for a number, as before.
  assert.equal(numbered('## Chapter 2 of the story\n', CHAPTER), '## Chapter 1. Chapter 2 of the story\n');
});

test('a template that ends in a letter is still read when the note is only partly numbered', () => {
  const s = { topTemplate: '{n}th', separator: '.' };
  const once = numbered('# A\n# B\n# C\n', s);
  assert.equal(once, '# 1th A\n# 2th B\n# 3th C\n');
  assert.equal(numbered(once + '# New\n', s), '# 1th A\n# 2th B\n# 3th C\n# 4th New\n');
  assert.equal(numbered('# 1th A\n# Plain\n', s), '# 1th A\n# 2th Plain\n');
});

test('headings with only a template and no text are left alone', () => {
  assert.deepEqual(planNumbering('# Chapter 1.\n', { ...DEFAULT_NUMBERING, ...CHAPTER }).edits, []);
  assert.equal(removed('# Chapter 1.\n', CHAPTER), '# Chapter 1.\n');
});

test('skipped headings lose template text and take none', () => {
  assert.equal(numbered('# Chapter 1. A ^skipped\n# B\n', CHAPTER), '# A ^skipped\n# Chapter 1. B\n');
  assert.equal(numbered('# A ^skipped\n# B\n', CHAPTER), '# A ^skipped\n# Chapter 1. B\n');
});

test('renames carry the template text, so links are rewritten', () => {
  const text = '# Guide\n## Setup\nSee [[#Setup]] and [[Guide#Setup]] and [x](Guide.md#Setup).\n';
  const plan = planNumbering(text, { ...DEFAULT_NUMBERING, ...CHAPTER });
  assert.equal(plan.renames.get('Guide'), 'Chapter 1. Guide');
  assert.equal(plan.renames.get('Setup'), '1.1. Setup');
  const edits = retargetLinks(text, plan.renames, () => true);
  const out = applyEdits(applyEdits(text, plan.edits), []);
  assert.ok(out.startsWith('# Chapter 1. Guide\n## 1.1. Setup'));
  assert.equal(
    applyEdits(text, edits),
    '# Guide\n## Setup\nSee [[#1.1. Setup]] and [[Guide#1.1. Setup]] and [x](Guide.md#1.1.%20Setup).\n',
  );
  // And a renamed top heading, in a note elsewhere.
  const top = retargetLinks('[[Guide#Guide]] [[Guide#Chapter 1. Guide]]', plan.renames, () => true);
  assert.equal(applyEdits('[[Guide#Guide]] [[Guide#Chapter 1. Guide]]', top), '[[Guide#Chapter 1. Guide]] [[Guide#Chapter 1. Guide]]');
});

test('renumbering under a changed template renames from the old text to the new', () => {
  const old = numbered('# Guide\n', CHAPTER);
  const plan = planNumbering(old, { ...DEFAULT_NUMBERING, topTemplate: 'Part {n}', knownTemplates: ['Chapter {n}.'] });
  assert.equal(plan.renames.get('Chapter 1. Guide'), 'Part 1. Guide');
});

test('the table of contents lists the template text and follows it', () => {
  const s = { ...DEFAULT_NUMBERING, ...CHAPTER } as NumberingSettings;
  const text = '# Guide\n**Contents** ^toc\n\n## Intro\n';
  const after = applyEdits(text, planNumbering(text, s).edits);
  const toc = updateContents(text, after, s);
  assert.ok(toc);
  assert.equal(toc.insert, '\n- [[#Chapter 1. Guide|Chapter 1. Guide]]\n\t- [[#1.1. Intro|1.1. Intro]]');
  const full = applyEdits(text, [...planNumbering(text, s).edits, toc]);
  // The list is already right, and numbering again changes neither the headings nor the list.
  assert.equal(updateContents(full, full, s), null);
  assert.deepEqual(planNumbering(full, s).edits, []);
  assert.ok(contentsList(full, s).includes('[[#Chapter 1. Guide|Chapter 1. Guide]]'));
});

test('shown numbers draw the template, and not over written template text', () => {
  const s = { ...DEFAULT_NUMBERING, ...CHAPTER } as NumberingSettings;
  assert.deepEqual(shownNumbers('# A\n## B\n', s).map((n) => n.number), ['Chapter 1. ', '1.1. ']);
  assert.deepEqual(shownNumbers('# Chapter 1. A\n## 1.1. B\n', s), []);
  assert.deepEqual(shownNumbers('# Chapter 1. A\n## B\n', s), []);
  // After the template changed, text written by the old one still counts as written.
  assert.deepEqual(shownNumbers('# Chapter 1. A\n', { ...s, topTemplate: 'Part {n}', knownTemplates: ['Chapter {n}.'] }), []);
});

test('live contents entries carry the shown template numbers', () => {
  const s = { ...DEFAULT_NUMBERING, ...CHAPTER } as NumberingSettings;
  const opts = { depth: null, numbers: true };
  assert.deepEqual(liveContentsEntries('# A\n## B\n', s, opts, true).map((e) => e.label), ['Chapter 1. A', '1.1. B']);
  assert.deepEqual(liveContentsEntries('# Chapter 1. A\n## 1.1. B\n', s, opts, true).map((e) => e.label), ['Chapter 1. A', '1.1. B']);
});

test('copy with numbers is the numbering plan applied, templates and all', () => {
  const text = '## Intro\n### Scope\n';
  assert.equal(numbered(text, CHAPTER), '## Chapter 1. Intro\n### 1.1. Scope\n');
  assert.equal(numbered(numbered(text, CHAPTER), CHAPTER), numbered(text, CHAPTER));
});

test('the original plugin\'s dotted numbers are replaced by a template-less note', () => {
  assert.equal(numbered('## 1.1 B\n## 1.2 C\n'), '## 1. B\n## 2. C\n');
  assert.equal(numbered('## 1.1 B\n## 1.2 C\n', CHAPTER), '## Chapter 1. B\n## Chapter 2. C\n');
});

test('remembering templates', () => {
  assert.deepEqual(rememberTemplates(undefined, '{n}', 'Chapter {n}.', ' {n} '), ['Chapter {n}.']);
  assert.deepEqual(rememberTemplates(['A {n}', 'B {n}'], 'A {n}', undefined), ['B {n}', 'A {n}']);
  assert.equal(rememberTemplates([], ...Array.from({ length: 40 }, (_, i) => `T${i} {n}`)).length, 30);
});

// Number styles

test('lowercase letters and Roman numerals', () => {
  assert.deepEqual([1, 2, 26, 27, 28, 52].map((n) => formatNumber(n, 'a')), ['a', 'b', 'z', 'aa', 'ab', 'az']);
  assert.deepEqual([1, 4, 9, 14, 40, 1994].map((n) => formatNumber(n, 'i')), ['i', 'iv', 'ix', 'xiv', 'xl', 'mcmxciv']);
  assert.equal(formatNumber(0, 'a'), '0');
  assert.equal(formatNumber(0, '一'), '0');
});

test('Chinese numerals', () => {
  const expected: Record<number, string> = {
    1: '一', 2: '二', 9: '九', 10: '十', 11: '十一', 19: '十九', 20: '二十', 21: '二十一', 99: '九十九',
    100: '一百', 101: '一百零一', 110: '一百一十', 111: '一百一十一', 120: '一百二十', 200: '二百', 999: '九百九十九',
    1000: '一千', 1001: '一千零一', 1010: '一千零一十', 1100: '一千一百', 1234: '一千二百三十四', 9999: '九千九百九十九',
  };
  for (const [n, text] of Object.entries(expected)) assert.equal(chineseNumeral(Number(n)), text, n);
  assert.equal(chineseNumeral(10000), '10000');
});

test('numbers with the new styles, and renumbering them', () => {
  assert.equal(numbered('# A\n## B\n## C\n', { topStyle: 'a', otherStyle: 'i' }), '# a. A\n## a.i. B\n## a.ii. C\n');
  assert.equal(numbered('# A\n## B\n## C\n', { topStyle: 'i', otherStyle: 'a' }), '# i. A\n## i.a. B\n## i.b. C\n');
  assert.equal(numbered('# A\n## B\n## C\n', { topStyle: '一', otherStyle: '一' }), '# 一. A\n## 一.一. B\n## 一.二. C\n');
  const long = Array.from({ length: 22 }, (_, i) => `# T${i}\n`).join('');
  const out = numbered(long, { topStyle: '一' });
  assert.ok(out.includes('# 十. T9\n') && out.includes('# 二十一. T20\n') && out.includes('# 二十二. T21\n'));
  assert.deepEqual(planNumbering(out, { ...DEFAULT_NUMBERING, topStyle: '一' }).edits, []);
});

test('Chinese numerals with a template: 第一章', () => {
  const s = { topStyle: '一', otherStyle: '1', topTemplate: '第{n}章', otherTemplate: '{n}' } as const;
  const once = numbered('# A\n## B\n# C\n', s);
  assert.equal(once, '# 第一章 A\n## 一.1. B\n# 第二章 C\n');
  assert.deepEqual(planNumbering(once, { ...DEFAULT_NUMBERING, ...s }).edits, []);
  assert.equal(removed(once, s), '# A\n## B\n# C\n');
});

test('every style is read back, in every style setting, when renumbering and removing', () => {
  for (const written of NUMBER_STYLES) {
    const text = numbered('# A\n## B\n## C\n# D\n', { topStyle: written, otherStyle: written });
    for (const configured of NUMBER_STYLES) {
      const s = { topStyle: configured, otherStyle: configured };
      // Digits and Chinese numerals are always read; letters and Roman numerals when they are the style.
      const readable = written === configured || written === '1' || written === '一';
      if (!readable) continue;
      assert.equal(removed(text, s), '# A\n## B\n## C\n# D\n', `${written} read as ${configured}`);
      assert.equal(numbered(text, s), numbered('# A\n## B\n## C\n# D\n', s), `${written} renumbered as ${configured}`);
    }
  }
});

test('Chinese numerals do not eat words or years', () => {
  assert.equal(numbered('## 一天的开始\n## 2024 in review\n', { topStyle: '一' }), '## 一. 一天的开始\n## 二. 2024 in review\n');
  assert.equal(numbered('## 三个火枪手\n', { topStyle: '一' }), '## 一. 三个火枪手\n');
});

test('lowercase styles do not take ordinary words for numbers', () => {
  assert.equal(numbered('## intro\n## mix of things\n', { topStyle: 'a' }), '## a. intro\n## b. mix of things\n');
  assert.equal(numbered('## to do\n', { topStyle: 'i' }), '## i. to do\n');
});

// Properties

test('the style names a, i and 一 are read from the property', () => {
  const read = (v: string) => {
    const s = noteSettings(`---\nnumber headings: ${v}\n---\n`);
    return s && !s.off ? [s.settings.topStyle, s.settings.otherStyle, s.settings.separator] : null;
  };
  assert.deepEqual(read('a.i'), ['a', 'i', '']);
  assert.deepEqual(read('i.a.'), ['i', 'a', '.']);
  assert.deepEqual(read('一.一)'), ['一', '一', ')']);
  assert.deepEqual(read('_.一.1'), ['一', '1', '']);
  assert.deepEqual(read('I.i'), ['I', 'i', '']);
});

test('template properties', () => {
  const read = (v: string) => {
    const s = noteSettings(`---\nnumber headings: ${v}\n---\n`);
    return s && !s.off ? [s.settings.topTemplate, s.settings.otherTemplate] : null;
  };
  assert.deepEqual(read('1.1'), ['{n}', '{n}']);
  assert.deepEqual(read('template-level-1 "Chapter {n}.", 1.1'), ['Chapter {n}.', '{n}']);
  assert.deepEqual(read('"first-level 2, template-level-1 \\"A, B {n}\\", template-level-other Sec {n}:, A.1"'), ['A, B {n}', 'Sec {n}:']);
  assert.deepEqual(read(`'template-level-1 "Today''s {n}", 1.1'`), ["Today's {n}", '{n}']);
  assert.deepEqual(read('template-level-1 "A, B {n}", template-level-other "Sec {n}:", 1.1.'), ['A, B {n}', 'Sec {n}:']);
  assert.deepEqual(read('template-level-other Sec {n}:'), ['{n}', 'Sec {n}:']);
  // An invalid template is ignored.
  assert.deepEqual(read('template-level-1 "no number", template-level-other "{n}{n}"'), ['{n}', '{n}']);
  // The rest of the property still reads, with a comma in the template.
  const s = noteSettings('---\nnumber headings: template-level-1 "A, {n}", max 3, 一.1\n---\n');
  assert.ok(s && !s.off && s.settings.maxLevel === 3 && s.settings.topStyle === '一');
});

test('a note\'s own property decides its numbering, and the global template is still recognised', () => {
  const globalSettings = { ...DEFAULT_NUMBERING, ...CHAPTER } as NumberingSettings;
  const text = '---\nnumber headings: template-level-1 "Part {n}", 1.1.\n---\n# A\n## B\n';
  const own = noteSettings(text);
  assert.ok(own && !own.off);
  const merged = mergeNoteSettings(globalSettings, own.settings);
  const once = applyEdits(text, planNumbering(text, merged).edits);
  assert.ok(once.endsWith('# Part 1. A\n## 1.1. B\n'));
  // A note already numbered under the global template is renumbered under its own.
  const legacy = '---\nnumber headings: template-level-1 "Part {n}", 1.1.\n---\n# Chapter 1. A\n## 1.1. B\n';
  assert.equal(applyEdits(legacy, planNumbering(legacy, merged).edits), once);
  // A property without templates means plain numbers, whatever the global setting.
  const plain = '---\nnumber headings: 1.1.\n---\n# Chapter 1. A\n';
  const plainOwn = noteSettings(plain);
  assert.ok(plainOwn && !plainOwn.off);
  assert.ok(applyEdits(plain, planNumbering(plain, mergeNoteSettings(globalSettings, plainOwn.settings)).edits).endsWith('# 1. A\n'));
});

test('saved settings with templates read back exactly', () => {
  for (const top of TEMPLATES) {
    for (const other of ['{n}', 'Section {n}', 'A, B {n}:']) {
      const s: NumberingSettings = { ...DEFAULT_NUMBERING, topTemplate: top, otherTemplate: other, topStyle: '一', otherStyle: 'a', startAt: 1 };
      const parsed = noteSettings(`---\nnumber headings: ${settingsToValue(s)}\n---\n`);
      assert.ok(parsed && !parsed.off);
      assert.deepEqual({ ...DEFAULT_NUMBERING, ...parsed.settings }, s);
    }
  }
  assert.equal(settingsToValue({ ...DEFAULT_NUMBERING, ...CHAPTER } as NumberingSettings),
    'first-level auto, max 6, skip ^skipped, start-at 1, template-level-1 "Chapter {n}.", template-level-other "{n}", 1.1.');
  assert.equal(settingsToValue(DEFAULT_NUMBERING), 'first-level auto, max 6, skip ^skipped, start-at 1, 1.1.');
});
