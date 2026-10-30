import assert from 'node:assert/strict';
import test from 'node:test';

import { createExtensions } from '../src/api.ts';
import type { RenumberedEvent } from '../src/api.ts';

const note = { path: 'a.md', text: '# A' };

function setup() {
  const logs: [string, unknown][] = [];
  const ext = createExtensions((m, e) => logs.push([m, e]));
  return { ext, logs };
}

const event: RenumberedEvent = { path: 'a.md', text: '', kind: 'numbered', renames: new Map(), changed: 1, linksUpdated: true };

test('the api is frozen and has exactly the documented members', () => {
  const api = setup().ext.api(() => {});
  assert.equal(api.apiVersion, 1);
  assert.deepEqual(Object.keys(api).sort(), ['apiVersion', 'claimNotes', 'on', 'redraw']);
  assert.ok(Object.isFrozen(api));
});

test('redraw calls what it was given', () => {
  let n = 0;
  setup().ext.api(() => n++).redraw();
  assert.equal(n, 1);
});

test('a claim is returned until its disposer runs, which is safe to run twice', () => {
  const { ext } = setup();
  const dispose = ext.claimNotes('x', () => ({ owner: 'X' }));
  assert.deepEqual(ext.claimFor(note), { owner: 'X' });
  dispose();
  dispose();
  assert.equal(ext.claimFor(note), null);
});

test('registering an id again replaces it, and the old disposer leaves the new handler alone', () => {
  const { ext } = setup();
  const first = ext.claimNotes('x', () => ({ owner: 'one' }));
  ext.claimNotes('x', () => ({ owner: 'two' }));
  assert.equal(ext.claimFor(note)?.owner, 'two');
  first();
  assert.equal(ext.claimFor(note)?.owner, 'two');
});

test('the first handler that claims wins', () => {
  const { ext } = setup();
  ext.claimNotes('a', () => null);
  ext.claimNotes('b', () => ({ owner: 'B' }));
  ext.claimNotes('c', () => ({ owner: 'C' }));
  assert.equal(ext.claimFor(note)?.owner, 'B');
});

test('a throwing handler counts as no claim, is logged once per id, and the next handler is still asked', () => {
  const { ext, logs } = setup();
  ext.claimNotes('bad', () => {
    throw new Error('boom');
  });
  ext.claimNotes('good', () => ({ owner: 'G' }));
  for (let i = 0; i < 3; i++) assert.equal(ext.claimFor(note)?.owner, 'G');
  assert.equal(logs.length, 1);
  assert.match(logs[0][0], /"bad"/);
});

test('a claim without an owner is named after its id', () => {
  const { ext } = setup();
  ext.claimNotes('pro', () => ({}) as { owner: string });
  assert.equal(ext.claimFor(note)?.owner, 'pro');
});

test('events reach every listener, and a failing one does not stop the rest', async () => {
  const { ext, logs } = setup();
  const seen: string[] = [];
  ext.on('renumbered', () => {
    throw new Error('sync');
  });
  ext.on('renumbered', () => Promise.reject(new Error('async')));
  ext.on('renumbered', (e) => void seen.push(e.path));
  ext.emit('renumbered', event);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(seen, ['a.md']);
  assert.equal(logs.length, 2);
});

test('a listener can be removed', () => {
  const { ext } = setup();
  let n = 0;
  const off = ext.on('settings-changed', () => void n++);
  ext.emit('settings-changed', undefined);
  off();
  ext.emit('settings-changed', undefined);
  assert.equal(n, 1);
});

test('after close nothing is claimed or heard, and registering does nothing', () => {
  const { ext } = setup();
  let n = 0;
  ext.claimNotes('x', () => ({ owner: 'X' }));
  ext.on('settings-changed', () => void n++);
  ext.close();
  assert.equal(ext.claimFor(note), null);
  ext.emit('settings-changed', undefined);
  const dispose = ext.claimNotes('y', () => ({ owner: 'Y' }));
  assert.equal(ext.claimFor(note), null);
  assert.doesNotThrow(dispose);
  assert.equal(n, 0);
});

test('misuse throws a TypeError where it happens', () => {
  const { ext } = setup();
  assert.throws(() => ext.claimNotes('', () => null), TypeError);
  assert.throws(() => ext.claimNotes('x', 'no' as never), TypeError);
  assert.throws(() => ext.on('renumbered', 'no' as never), TypeError);
});
