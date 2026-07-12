import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createBrowserDoubles } from "./helpers/browser-doubles.mjs";
import { createClassicContext, loadClassicScripts } from "./helpers/classic-script-loader.mjs";

async function indexScriptSources() {
  const html = await readFile("index.html", "utf8");
  return [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)].map((match) => match[1]);
}

test("index keeps a dependency-free ordered classic-script boot", async () => {
  const html = await readFile("index.html", "utf8");
  const scripts = await indexScriptSources();
  const expectedScripts = [
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
    "js/systems/core.js",
    "js/systems/world.js",
    "js/systems/progression.js",
    "js/systems/events.js",
    "js/systems/spells.js",
    "js/systems/combat.js",
    "js/systems/enemy-ai.js",
    "js/systems/boss-ai.js",
    "js/ui/input.js",
    "js/ui/presentation.js",
    "js/data/catalog.js",
    "js/core/context.js",
    "game.js",
  ];

  assert.equal(/type=["']module["']/.test(html), false);
  assert.equal(/<script\b[^>]*\b(?:async|defer)\b/i.test(html), false);
  assert.deepEqual(scripts, expectedScripts);
  assert.equal(new Set(scripts).size, scripts.length);

  for (const script of scripts) {
    const source = await readFile(script, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${script} must not fetch local content`);
    assert.doesNotMatch(source, /^\s*(?:import|export)\s/m, `${script} must remain a classic script`);
  }
});

test("all browser scripts load, render the menu, and start a run", async () => {
  const doubles = createBrowserDoubles();
  const context = createClassicContext(doubles.globals);
  const scripts = await indexScriptSources();

  await loadClassicScripts(scripts, { context });

  const primaryAction = doubles.document.getElementById("primaryAction");
  assert.equal(primaryAction.textContent, "Начать восхождение");
  assert.equal(primaryAction._listeners.click.length, 1);

  primaryAction.dispatch("click");

  assert.match(doubles.document.getElementById("hpText").textContent, /^\d+\/\d+$/);
  assert.notEqual(doubles.document.getElementById("traitName").textContent, "—");
  assert.match(doubles.document.getElementById("floorLabel").textContent, /Этаж 1/);

  doubles.document.dispatch("keydown", {
    key: "ArrowRight",
    code: "ArrowRight",
    preventDefault() {},
  });
});

test("assembled browser runtime supports movement, interaction, casting, upgrades, bosses, and restart", async () => {
  const doubles = createBrowserDoubles();
  const context = createClassicContext(doubles.globals);
  await loadClassicScripts(await indexScriptSources(), { context });

  const primaryAction = doubles.document.getElementById("primaryAction");
  primaryAction.dispatch("click");

  const runtime = context.MagicTower.runtime.game;
  const game = runtime.context;
  const { api, data, state } = game;

  state.enemies = [];
  state.objects = [];
  const directions = [
    { dx: 1, dy: 0, key: "ArrowRight" },
    { dx: -1, dy: 0, key: "ArrowLeft" },
    { dx: 0, dy: 1, key: "ArrowDown" },
    { dx: 0, dy: -1, key: "ArrowUp" },
  ];
  const direction = directions.find(({ dx, dy }) => api.isFreeCell(state.player.x + dx, state.player.y + dy));
  assert.ok(direction, "generated start room must offer a free movement cell");
  const oldPosition = `${state.player.x},${state.player.y}`;
  runtime.dispatchKey(direction.key);
  assert.notEqual(`${state.player.x},${state.player.y}`, oldPosition);

  state.enemies = [];
  state.objects = [{
    id: game.ids.next(),
    type: data.EVENT_TYPES.CHEST,
    x: state.player.x,
    y: state.player.y,
    used: false,
  }];
  state.player.mana = 0;
  runtime.dispatchKey("e", "KeyE");
  assert.equal(state.objects[0].used, true);
  assert.ok(state.player.mana > 0);

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
  state.player.x = 5;
  state.player.y = 5;
  state.player.spells = ["magicMissile"];
  state.player.spellLevels.magicMissile = 1;
  state.player.mana = state.player.maxMana;
  state.objects = [];
  const target = api.createEnemy("skeleton", 6, 5, state.floor, { hp: 100, maxHp: 100 });
  state.enemies = [target];
  const targetHp = target.hp;
  runtime.dispatchKey(" ", "Space");
  assert.ok(target.hp < targetHp);

  state.player.spells = ["fireball"];
  state.player.spellLevels.fireball = 1;
  state.player.magicShards = 1;
  runtime.dispatchKey("u", "KeyU");
  runtime.dispatchKey("1", "Digit1");
  assert.equal(state.player.spellLevels.fireball, 2);

  runtime.startFloor(5);
  assert.equal(state.floor, 5);
  const boss = state.enemies.find((enemy) => enemy.boss);
  assert.equal(boss.definitionId, "stoneArchgolem");
  api.damageEnemy(boss, 999, "smoke test", "arcane");
  assert.equal(state.mode, data.MODES.RELIC_CHOICE);
  assert.equal(state.pendingBossRelicChoices.length, 3);
  runtime.dispatchKey("1", "Digit1");
  assert.equal(state.mode, data.MODES.PLAYING);
  assert.equal(state.player.artifacts.length, 1);

  state.player.hp = 1;
  state.player.shield = 0;
  state.player.floorBlockAvailable = false;
  state.player.relicFirstDamageReductionAvailable = false;
  api.damagePlayer(999, "Smoke test damage.");
  assert.equal(state.mode, data.MODES.GAME_OVER);
  primaryAction.dispatch("click");
  assert.equal(state.mode, data.MODES.PLAYING);
  assert.ok(state.player.hp > 0);
});
