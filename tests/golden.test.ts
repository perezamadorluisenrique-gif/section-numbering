import assert from 'node:assert/strict';
import test from 'node:test';

import { noteSettings } from '../src/frontmatter.ts';
import { resolveSettings, ruleFor } from '../src/rules.ts';
import { GOLDEN_090, NOTES, digest } from './golden-corpus.ts';

/** What 0.9.0 did: the plugin's settings, then the folder rule, then the note's property. */
test('no corpus note carries a numbering profile, so the hash covers the unguarded case', () => {
  for (const [name, text] of NOTES) assert.doesNotMatch(text, /numbering[ _-]profile/i, name);
});

test('0.10.0 numbers exactly as 0.9.0 did', () => {
  const actual = digest((path, text, base, rules, readFrontMatter) =>
    resolveSettings(base, ruleFor(path, rules), readFrontMatter ? noteSettings(text) : null),
  );
  if (GOLDEN_090 === '') assert.fail(`record this as GOLDEN_090: ${actual}`);
  assert.equal(actual, GOLDEN_090);
});
