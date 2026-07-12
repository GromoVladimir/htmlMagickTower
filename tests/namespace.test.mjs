import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createClassicContext,
  loadClassicScripts,
} from './helpers/classic-script-loader.mjs';

const namespaceScript = 'js/namespace.js';

test('namespace script exposes one stable MagicTower root', async () => {
  const context = await loadClassicScripts([namespaceScript]);
  const MT = context.MagicTower;

  assert.ok(MT);
  assert.strictEqual(context.window.MagicTower, MT);
  assert.strictEqual(context.self.MagicTower, MT);
  assert.deepEqual(
    Object.keys(MT).sort(),
    [
      'behaviors',
      'data',
      'deepFreeze',
      'registerBehavior',
      'registerData',
      'registerRuntime',
      'registerSystem',
      'registerUi',
      'runtime',
      'systems',
      'ui',
    ].sort()
  );
  assert.equal(Object.isFrozen(MT), true);
  assert.equal(Object.getPrototypeOf(MT.data), null);
  assert.equal(Object.getPrototypeOf(MT.behaviors), null);
});

test('registerData deep-freezes a catalog and rejects duplicate categories', async () => {
  const context = await loadClassicScripts([namespaceScript]);
  const MT = context.MagicTower;
  const definition = {
    entries: [{ id: 'fireball', tags: ['fire'] }],
  };

  const registered = MT.registerData('spells', definition);

  assert.strictEqual(registered, definition);
  assert.strictEqual(MT.data.spells, definition);
  assert.equal(Object.isFrozen(definition), true);
  assert.equal(Object.isFrozen(definition.entries), true);
  assert.equal(Object.isFrozen(definition.entries[0]), true);
  assert.equal(Object.isFrozen(definition.entries[0].tags), true);
  assert.equal(Object.getOwnPropertyDescriptor(MT.data, 'spells').writable, false);
  assert.throws(
    () => MT.registerData('spells', {}),
    /registration "spells" already exists/
  );
});

test('deepFreeze supports cyclic object graphs', async () => {
  const context = await loadClassicScripts([namespaceScript]);
  const node = { id: 'cycle' };
  node.self = node;

  const result = context.MagicTower.deepFreeze(node);

  assert.strictEqual(result, node);
  assert.equal(Object.isFrozen(node), true);
  assert.strictEqual(node.self, node);
});

test('all section registrars protect names without freezing runtime implementations', async () => {
  const context = await loadClassicScripts([namespaceScript]);
  const MT = context.MagicTower;
  const registrations = [
    [MT.registerBehavior, MT.behaviors, 'combatHooks'],
    [MT.registerSystem, MT.systems, 'combat'],
    [MT.registerUi, MT.ui, 'renderer'],
    [MT.registerRuntime, MT.runtime, 'context'],
  ];

  for (const [register, section, name] of registrations) {
    const implementation = { mutable: true };
    assert.strictEqual(register(name, implementation), implementation);
    assert.strictEqual(section[name], implementation);
    assert.equal(Object.isFrozen(implementation), false);
    assert.throws(
      () => register(name, {}),
      new RegExp(`registration "${name}" already exists`)
    );
  }
});

test('registration validates names and values before changing a section', async () => {
  const context = await loadClassicScripts([namespaceScript]);
  const MT = context.MagicTower;

  assert.throws(() => MT.registerData('', {}), /non-empty trimmed string/);
  assert.throws(() => MT.registerData(' spells ', {}), /non-empty trimmed string/);
  assert.throws(() => MT.registerData('spells', undefined), /cannot be undefined/);
  assert.deepEqual(Object.keys(MT.data), []);
});

test('loading namespace.js twice fails loudly instead of replacing registrations', async () => {
  const context = createClassicContext();
  await loadClassicScripts([namespaceScript], { context });
  const firstNamespace = context.MagicTower;

  await assert.rejects(
    loadClassicScripts([namespaceScript], { context }),
    /namespace is already initialized/
  );
  assert.strictEqual(context.MagicTower, firstNamespace);
});
