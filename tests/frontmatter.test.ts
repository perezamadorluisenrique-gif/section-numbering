import assert from 'node:assert/strict';
import test from 'node:test';

import { noteSettings } from '../src/frontmatter.ts';
import { applyEdits } from '../src/markdown.ts';
import { DEFAULT_NUMBERING, planNumbering } from '../src/numbering.ts';

const note = (value: string, body = '# A\n') => `---\ntags: x\nnumber headings: ${value}\n---\n${body}`;

test('a note without the key has no settings of its own', () => {
  assert.equal(noteSettings('# A\n## B\n'), null);
  assert.equal(noteSettings('---\ntags: x\n---\n# A\n'), null);
  // The key in the body is not front matter.
  assert.equal(noteSettings('# A\nnumber headings: off\n'), null);
});

test('off leaves the note alone', () => {
  assert.deepEqual(noteSettings(note('off')), { off: true });
  assert.deepEqual(noteSettings(note('auto, off')), { off: true });
});

test('reads first-level, max, start-at and the style', () => {
  assert.deepEqual(noteSettings(note('auto, first-level 2, max 4, start-at 3, A.1')), {
    off: false,
    settings: { separator: '', firstLevel: 2, maxLevel: 4, startAt: 3, topStyle: 'A', otherStyle: '1' },
  });
});

test('a separator after the style is kept', () => {
  const sep = (v: string) => {
    const s = noteSettings(note(v));
    return s && !s.off ? s.settings.separator : null;
  };
  assert.equal(sep('1.1'), '');
  assert.equal(sep('1.1.'), '.');
  assert.equal(sep('1.1)'), ')');
  assert.equal(sep('1.1:'), ':');
  assert.equal(sep('1.1 —'), ' —');
  assert.equal(sep('I.A -'), ' -');
});

test('_.1.1 starts numbering one level lower', () => {
  const s = noteSettings(note('_.1.1'));
  assert.deepEqual(s, { off: false, settings: { separator: '', firstLevel: 2, topStyle: '1', otherStyle: '1' } });
  const t = noteSettings(note('first-level 2, _.1.1'));
  assert.ok(t && !t.off && t.settings.firstLevel === 3);
});

test('contents, quotes and unknown parts are ignored; skip is read', () => {
  assert.deepEqual(noteSettings(note('"auto, contents ^toc, skip ^skipped, max 3"')), {
    off: false,
    settings: { separator: '', maxLevel: 3, skipAnchor: 'skipped' },
  });
});

test('start-at shifts the top-level count', () => {
  const text = '# Intro\n## Part\n# Next\n';
  const plan = planNumbering(text, { ...DEFAULT_NUMBERING, separator: '', startAt: 5 });
  assert.equal(applyEdits(text, plan.edits), '# 5 Intro\n## 5.1 Part\n# 6 Next\n');
});

test('a note numbered by Number Headings renumbers exactly as it looks', () => {
  const body = '## 1 Setup\n### 1.1 Install\n## 3 Usage\n';
  const text = note('first-level 2, max 3, 1.1', body);
  const s = noteSettings(text);
  assert.ok(s && !s.off);
  const plan = planNumbering(text, { ...DEFAULT_NUMBERING, ...s.settings });
  assert.equal(applyEdits(text, plan.edits), note('first-level 2, max 3, 1.1', '## 1 Setup\n### 1.1 Install\n## 2 Usage\n'));
});
