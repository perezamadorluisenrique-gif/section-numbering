import assert from 'node:assert/strict';
import test from 'node:test';

import { noteSettings, parseNumberingValue } from '../src/frontmatter.ts';
import { DEFAULT_NUMBERING, shownNumbers } from '../src/numbering.ts';
import { normalizeFolder, renameRules, resolveSettings, ruleFor, ruleTemplates } from '../src/rules.ts';
import type { FolderRule } from '../src/rules.ts';

const rule = (folder: string, value: string, show?: FolderRule['show']): FolderRule => ({ folder, value, show });

test('a value parses the same as the property it came from', () => {
  const value = 'first-level 2, max 4, A.1.';
  assert.deepEqual(parseNumberingValue(value), noteSettings(`---\nnumber headings: ${value}\n---\n`));
  assert.deepEqual(parseNumberingValue('off'), { off: true });
});

test('normalizeFolder drops stray slashes; the root is empty', () => {
  assert.equal(normalizeFolder('/Papers//2026/'), 'Papers/2026');
  assert.equal(normalizeFolder('/'), '');
  assert.equal(normalizeFolder(''), '');
});

test('ruleFor picks the deepest folder that holds the note', () => {
  const rules = [rule('Papers', 'A.1'), rule('Papers/2026', 'I.1')];
  assert.equal(ruleFor('Papers/2026/a.md', rules), rules[1]);
  assert.equal(ruleFor('Papers/b.md', rules), rules[0]);
  assert.equal(ruleFor('Other/c.md', rules), null);
});

test('Papers does not capture Papers-old', () => {
  assert.equal(ruleFor('Papers-old/x.md', [rule('Papers', 'A.1')]), null);
});

test('the root rule holds every note, and the first of two equal folders wins', () => {
  const rules = [rule('', 'A.1'), rule('Papers', 'I.1'), rule('/Papers/', 'off')];
  assert.equal(ruleFor('x.md', rules), rules[0]);
  assert.equal(ruleFor('Papers/x.md', rules), rules[1]);
});

test('settings: the note wins over the rule, the rule over the plugin', () => {
  const base = { ...DEFAULT_NUMBERING };
  assert.equal(resolveSettings(base, null, null), base);
  assert.equal(resolveSettings(base, rule('P', 'A.1'), null)?.topStyle, 'A');
  assert.equal(resolveSettings(base, rule('P', 'A.1'), noteSettings('---\nnumber headings: I.1\n---\n'))?.topStyle, 'I');
});

test('a rule that is off leaves a note alone unless the note has its own settings', () => {
  const base = { ...DEFAULT_NUMBERING };
  assert.equal(resolveSettings(base, rule('P', 'off'), null), null);
  assert.equal(resolveSettings(base, rule('P', 'off'), noteSettings('---\nnumber headings: 1.1\n---\n'))?.topStyle, '1');
  assert.equal(resolveSettings(base, rule('P', 'A.1'), noteSettings('---\nnumber headings: off\n---\n')), null);
});

test('an empty rule changes nothing', () => {
  const base = { ...DEFAULT_NUMBERING };
  assert.equal(resolveSettings(base, rule('P', '  '), null), base);
});

test('a rule that skips the top level starts one level lower', () => {
  const settings = resolveSettings({ ...DEFAULT_NUMBERING }, rule('P', '_.1.1'), null);
  assert.equal(settings?.firstLevel, 2);
});

test('a rule with a template keeps the plugin templates known', () => {
  const base = { ...DEFAULT_NUMBERING, topTemplate: 'Part {n}.', otherTemplate: '{n}' };
  const settings = resolveSettings(base, rule('P', 'template-level-1 "Chapter {n}."'), null);
  assert.equal(settings?.topTemplate, 'Chapter {n}.');
  assert.ok(settings?.knownTemplates?.includes('Part {n}.'));
});

test('ruleTemplates collects the templates of every rule', () => {
  const known = ruleTemplates([rule('A', 'template-level-1 "Chapter {n}."'), rule('B', 'off'), rule('C', '')], ['Old {n}']);
  assert.deepEqual(known, ['Old {n}', 'Chapter {n}.']);
});

test('numbers shown with a rule use its style', () => {
  const settings = resolveSettings({ ...DEFAULT_NUMBERING }, rule('P', 'A.1'), null);
  assert.ok(settings);
  assert.match(shownNumbers('# a\n## b\n', settings)[0].number, /^A/);
});

test('renaming a folder moves the rules at and under it, not a lookalike', () => {
  const rules = [rule('Papers', 'A.1'), rule('Papers/2026', 'I.1'), rule('Papers-old', 'off')];
  const next = renameRules(rules, 'Papers', 'Articles');
  assert.deepEqual(next.map((r) => r.folder), ['Articles', 'Articles/2026', 'Papers-old']);
  assert.equal(next[2], rules[2]);
  assert.deepEqual(renameRules([rule('A/B', 'x')], 'A', 'C/D').map((r) => r.folder), ['C/D/B']);
});
