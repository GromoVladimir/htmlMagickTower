import assert from "node:assert/strict";
import test from "node:test";

import { loadClassicScripts } from "./helpers/classic-script-loader.mjs";

async function loadContext() {
  return loadClassicScripts([
    "js/namespace.js",
    "js/core/context.js",
  ]);
}

test("GameContext creates isolated mutable state graphs", async () => {
  const context = await loadContext();
  const api = context.MagicTower.runtime.context;
  const data = { MODES: { MENU: "menu" } };
  const first = api.createGameContext({ data, random: () => 0.25 });
  const second = api.createGameContext({ data, random: () => 0.75 });

  first.state.enemies.push({ id: 1 });
  first.state.lastMoveDir.x = -1;

  assert.equal(second.state.enemies.length, 0);
  assert.deepEqual(
    { x: second.state.lastMoveDir.x, y: second.state.lastMoveDir.y },
    { x: 1, y: 0 }
  );
});

test("GameContext RNG and ID services are deterministic and state-backed", async () => {
  const context = await loadContext();
  const game = context.MagicTower.runtime.context.createGameContext({
    data: { MODES: { MENU: "menu" } },
    random: () => 0.375,
  });

  assert.equal(game.rng.next(), 0.375);
  assert.equal(game.ids.next(), 2);
  assert.equal(game.ids.next(), 3);
  assert.equal(game.state.idCounter, 3);
});
