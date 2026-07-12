import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import { createClassicContext, loadClassicScripts } from "./helpers/classic-script-loader.mjs";

const catalogScripts = [
  "js/namespace.js",
  "js/data/config.js",
  "js/data/spells.js",
  "js/data/traits.js",
  "js/data/artifacts.js",
  "js/data/enemies.js",
  "js/data/bosses.js",
  "js/data/world.js",
  "js/data/events.js",
  "js/behaviors/effects.js",
  "js/behaviors/artifact-hooks.js",
  "js/systems/spells.js",
  "js/systems/enemy-ai.js",
  "js/systems/boss-ai.js",
  "js/systems/events.js",
  "js/data/catalog.js",
];

async function loadMutatedCatalog(targetPath, mutate) {
  const context = createClassicContext();
  for (const scriptPath of catalogScripts) {
    const original = await readFile(scriptPath, "utf8");
    const source = scriptPath === targetPath ? mutate(original) : original;
    new vm.Script(source, { filename: scriptPath }).runInContext(context);
  }
  return context;
}

test("content catalog validates every cross-reference", async () => {
  const context = await loadClassicScripts(catalogScripts);
  const catalog = context.MagicTower.runtime.catalog;

  assert.strictEqual(catalog, context.MagicTower.data.catalog);
  assert.equal(Object.isFrozen(context.MagicTower.data.catalog), true);
  assert.equal(catalog.validate(), true);
  assert.equal(Object.keys(catalog.SPELLS).length, 9);
  assert.equal(catalog.TRAITS.length, 16);
  assert.equal(Object.keys(catalog.artifactsById).length, 30);
  assert.equal(Object.keys(catalog.FLOOR_RULES).length, 15);
});

test("boss alias resolves to the canonical immutable definition", async () => {
  const context = await loadClassicScripts(catalogScripts);
  const catalog = context.MagicTower.runtime.catalog;

  assert.equal(catalog.resolveBossId("boss"), "stoneArchgolem");
  assert.equal(catalog.getBoss("boss"), catalog.getBoss("stoneArchgolem"));
  assert.equal(catalog.ENEMY_TYPES.boss, catalog.ENEMY_TYPES.stoneArchgolem);
  assert.equal(Object.isFrozen(catalog.ENEMY_TYPES), true);
});

test("catalog lookups return definitions without copying mutable runtime state", async () => {
  const context = await loadClassicScripts(catalogScripts);
  const catalog = context.MagicTower.runtime.catalog;

  assert.equal(catalog.getSpell("fireball").name, "Огненный шар");
  assert.equal(catalog.getArtifact("focusShard").id, "focusShard");
  assert.equal(catalog.getTrait("pyromancer").element, "fire");
  assert.equal(catalog.getEvent("trialRoom").id, "trialRoom");
  assert.equal(Object.isFrozen(catalog.getArtifact("focusShard")), true);
});

test("catalog validation rejects duplicate IDs and broken pool references", async () => {
  await assert.rejects(
    loadMutatedCatalog("js/data/artifacts.js", (source) =>
      source.replace('id: "moonVessel"', 'id: "focusShard"')
    ),
    /Duplicate artifact id: focusShard/
  );

  await assert.rejects(
    loadMutatedCatalog("js/data/world.js", (source) =>
      source.replace(
        'default: ["rat", "rat", "skeleton", "livingBook", "smallGolem"]',
        'default: ["rat", "rat", "missingEnemy", "livingBook", "smallGolem"]'
      )
    ),
    /Enemy pool references missing enemy missingEnemy/
  );
});
