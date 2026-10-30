import assert from 'node:assert/strict';
import test from 'node:test';

import { profileValue } from '../src/frontmatter.ts';
import { decideNote } from '../src/guard.ts';
import type { DecideInput } from '../src/guard.ts';
import { DEFAULT_NUMBERING } from '../src/numbering.ts';
import { GOLDEN_090, digest } from './golden-corpus.ts';

const fm = (...lines: string[]) => `---\n${lines.join('\n')}\n---\n# Uno\n## Dos\n`;

const decide = (text: string, over: Partial<DecideInput> = {}) =>
  decideNote({
    path: 'n.md',
    text,
    base: DEFAULT_NUMBERING,
    rules: [],
    readFrontMatter: true,
    claim: () => null,
    ...over,
  });

test('profileValue reads the three spellings and unquotes', () => {
  assert.equal(profileValue(fm('numbering profile: legal-es')), 'legal-es');
  assert.equal(profileValue(fm('numbering_profile: legal-es')), 'legal-es');
  assert.equal(profileValue(fm('Numbering-Profile: "legal-es"')), 'legal-es');
  assert.equal(profileValue(fm("numbering profile: 'legal-es'")), 'legal-es');
});

test('profileValue: empty is null, off is off in any case, and only front matter counts', () => {
  assert.equal(profileValue(fm('numbering profile:')), null);
  assert.equal(profileValue(fm('numbering profile: OFF')), 'off');
  assert.equal(profileValue('# Uno\n\nnumbering profile: legal-es\n'), null);
  assert.equal(profileValue('---\ntitle: x\n---\n```\n---\nnumbering profile: x\n---\n```\n'), null);
  assert.equal(profileValue('# Uno'), null);
});

test('a note with no property is decided as in 0.9.0', () => {
  assert.equal(decide('# Uno').kind, 'number');
  assert.deepEqual(decide(fm('number headings: off')), { kind: 'off', reason: 'note', folder: '' });
  assert.deepEqual(decide('# Uno', { path: 'docs/n.md', rules: [{ folder: 'docs', value: 'off' }] }), {
    kind: 'off',
    reason: 'folder',
    folder: 'docs',
  });
});

test('a profile nobody claimed leaves the note alone, whatever else it says', () => {
  assert.deepEqual(decide(fm('numbering profile: legal-es')), { kind: 'profile', profile: 'legal-es' });
  assert.equal(decide(fm('numbering profile: legal-es', 'number headings: A.1')).kind, 'profile');
  assert.equal(decide(fm('numbering profile: legal-es'), { readFrontMatter: false }).kind, 'profile');
  assert.equal(
    decide(fm('numbering profile: legal-es'), { path: 'docs/n.md', rules: [{ folder: 'docs', value: 'off' }] }).kind,
    'profile',
  );
});

test('numbering profile: off means no profile, so the free layers apply', () => {
  const a = decide(fm('numbering profile: off', 'number headings: A.1'));
  assert.equal(a.kind, 'number');
  assert.equal(a.kind === 'number' && a.settings.topStyle, 'A');
  assert.deepEqual(decide(fm('numbering profile: off', 'number headings: off')), { kind: 'off', reason: 'note', folder: '' });
});

test('a claim wins over the property and over number headings: off', () => {
  const claim = () => ({ owner: 'Pro' });
  assert.deepEqual(decide('# Uno', { claim }), { kind: 'claimed', owner: 'Pro' });
  assert.equal(decide(fm('number headings: off'), { claim }).kind, 'claimed');
  assert.equal(decide(fm('numbering profile: x'), { claim }).kind, 'claimed');
});

test('a claim that returns null changes nothing', () => {
  assert.equal(decide('# Uno').kind, 'number');
  assert.equal(decide(fm('numbering profile: x')).kind, 'profile');
});

test('decideNote with no claims gives the 0.9.0 numbers', () => {
  const actual = digest((path, text, base, rules, readFrontMatter) => {
    const d = decideNote({ path, text, base, rules, readFrontMatter, claim: () => null });
    return d.kind === 'number' ? d.settings : null;
  });
  assert.equal(actual, GOLDEN_090);
});

