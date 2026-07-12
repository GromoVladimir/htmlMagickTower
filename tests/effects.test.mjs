import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadClassicScripts } from "./helpers/classic-script-loader.mjs";

async function loadRuntime() {
  const html = await readFile("index.html", "utf8");
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)]
    .map((match) => match[1])
    .filter((source) => source !== "game.js");
  return loadClassicScripts(scripts);
}

function createEffectContext(MT) {
  const context = MT.runtime.context.createGameContext({
    data: MT.runtime.catalog,
    random: () => 0,
  });
  MT.systems.core(context);
  MT.systems.progression(context);
  Object.assign(context.api, {
    updateOverlay() {},
    updateUI() {},
  });
  return context;
}

test("specialized max-health and max-mana effects preserve current-value semantics", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;
  const context = createEffectContext(MT);
  const effects = MT.behaviors.effects;
  const player = context.api.createPlayer();

  player.hp = 4;
  effects.changeMaxHp(player, 3);
  assert.deepEqual({ hp: player.hp, maxHp: player.maxHp }, { hp: 7, maxHp: 13 });
  effects.changeMaxHp(player, -20);
  assert.deepEqual({ hp: player.hp, maxHp: player.maxHp }, { hp: 1, maxHp: 1 });

  player.mana = 2;
  effects.changeMaxMana(player, 4);
  assert.deepEqual({ mana: player.mana, maxMana: player.maxMana }, { mana: 6, maxMana: 12 });
  effects.changeMaxMana(player, -20);
  assert.deepEqual({ mana: player.mana, maxMana: player.maxMana }, { mana: 1, maxMana: 1 });
});

test("representative trait and artifact descriptors match their original stat changes", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;
  const context = createEffectContext(MT);
  const effects = MT.behaviors.effects;

  const reserve = context.api.createPlayer();
  effects.applyEffects(context, reserve, context.data.getTrait("deepReserve").onAcquire);
  assert.deepEqual({ mana: reserve.mana, maxMana: reserve.maxMana }, { mana: 12, maxMana: 12 });

  const nervous = context.api.createPlayer();
  effects.applyEffects(context, nervous, context.data.getTrait("nervousTalent").onAcquire);
  assert.equal(nervous.spellDamageMultiplier, 1.15);
  assert.deepEqual({ hp: nervous.hp, maxHp: nervous.maxHp }, { hp: 9, maxHp: 9 });

  const cursed = context.api.createPlayer();
  effects.applyEffects(context, cursed, context.data.getArtifact("crackedCrown").onAcquire);
  assert.equal(cursed.spellDamageMultiplier, 1.35);
  assert.deepEqual({ hp: cursed.hp, maxHp: cursed.maxHp }, { hp: 8, maxHp: 8 });

  const keyBearer = context.api.createPlayer();
  keyBearer.mana = 0;
  effects.applyEffects(context, keyBearer, context.data.getArtifact("forgottenArchmageKey").onAcquire);
  assert.equal(keyBearer.magicShards, 1);
  assert.equal(keyBearer.mana, keyBearer.maxMana);
  assert.equal(keyBearer.spellUpgradeDiscount, 1);
});

test("every content effect is declarative and every passive recomputation is idempotent", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;
  const context = createEffectContext(MT);
  const definitions = [
    ...context.data.ARTIFACTS,
    ...context.data.SECRET_ARTIFACTS,
    ...context.data.BOSS_RELICS,
  ];

  [...context.data.TRAITS, ...definitions].forEach((definition) => {
    assert.equal(Object.hasOwn(definition, "apply"), false, `${definition.id}.apply must not exist`);
    assert.equal(Object.hasOwn(definition, "refreshFlags"), false, `${definition.id}.refreshFlags must not exist`);
    assert.equal(Object.isFrozen(definition), true);
  });

  for (const definition of definitions) {
    const player = context.api.createPlayer();
    player.spells = Object.keys(context.data.SPELLS);
    player.spellEvolutions = Object.fromEntries(
      Object.entries(context.data.SPELL_EVOLUTIONS)
        .map(([spellId, evolutions]) => [spellId, evolutions[0].id])
    );
    player.artifacts = [{ definitionId: definition.id, active: true, spent: false }];
    context.state.player = player;

    context.api.refreshArtifactFlags();
    const first = JSON.stringify(player.artifactFlags);
    context.api.refreshArtifactFlags();
    const second = JSON.stringify(player.artifactFlags);
    assert.equal(second, first, `${definition.id} passives must not accumulate`);
  }
});
