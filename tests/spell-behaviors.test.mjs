import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadClassicScripts } from "./helpers/classic-script-loader.mjs";

async function preBootstrapScripts() {
  const html = await readFile("index.html", "utf8");
  return [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)]
    .map((match) => match[1])
    .filter((source) => source !== "game.js");
}

function createSpellContext(MT) {
  const context = MT.runtime.context.createGameContext({
    data: MT.runtime.catalog,
    random: () => 0,
  });
  ["core", "world", "progression", "events", "spells", "combat", "enemyAi", "bossAi"]
    .forEach((name) => MT.systems[name](context));

  Object.assign(context.api, {
    addEffect() {},
    updateOverlay() {},
    updateUI() {},
  });
  return context;
}

function resetSpellScenario(context, spellId, evolutionId) {
  const { api, data, state } = context;
  state.mode = data.MODES.PLAYING;
  state.floor = 8;
  state.turn = 0;
  state.logs = [];
  state.hazards = [];
  state.barriers = [];
  state.effects = [];
  state.objects = [];
  state.activeChallenge = null;
  state.lastMoveDir = { x: 1, y: 0 };
  state.map = Array.from(
    { length: data.CONFIG.mapHeight },
    () => Array(data.CONFIG.mapWidth).fill(data.TILES.FLOOR)
  );
  state.visible = Array.from(
    { length: data.CONFIG.mapHeight },
    () => Array(data.CONFIG.mapWidth).fill(true)
  );
  state.explored = Array.from(
    { length: data.CONFIG.mapHeight },
    () => Array(data.CONFIG.mapWidth).fill(true)
  );

  state.player = api.createPlayer();
  state.player.x = 5;
  state.player.y = 5;
  state.player.hp = state.player.maxHp - 2;
  state.player.spells = [spellId];
  state.player.spellLevels[spellId] = 3;
  state.player.spellEvolutions = evolutionId ? { [spellId]: evolutionId } : {};
  api.refreshArtifactFlags();

  const primary = api.createEnemy("skeleton", 6, 5, state.floor, { hp: 100, maxHp: 100 });
  if (spellId === "shadowSpike") {
    primary.hp = 90;
  }
  const secondary = api.createEnemy("rat", 7, 5, state.floor, { hp: 100, maxHp: 100 });
  state.enemies = [primary, secondary];
}

test("every base spell and evolution dispatches through its registered behavior", async () => {
  const vmContext = await loadClassicScripts(await preBootstrapScripts());
  const MT = vmContext.MagicTower;
  const context = createSpellContext(MT);
  let scenarios = 0;

  for (const spell of Object.values(MT.runtime.catalog.SPELLS)) {
    const evolutionIds = (MT.runtime.catalog.SPELL_EVOLUTIONS[spell.id] || [])
      .map((evolution) => evolution.id);
    for (const evolutionId of [null, ...evolutionIds]) {
      resetSpellScenario(context, spell.id, evolutionId);
      const result = context.api.castSpell(spell);
      assert.equal(
        result,
        true,
        `${spell.id}${evolutionId ? `/${evolutionId}` : "/base"} must perform an action`
      );
      scenarios += 1;
    }
  }

  assert.equal(scenarios, 27);
});
