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

function createAiContext(MT) {
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

  const { data, state } = context;
  state.mode = data.MODES.PLAYING;
  state.floor = 12;
  state.player = context.api.createPlayer();
  state.player.x = 5;
  state.player.y = 5;
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
  state.rooms = [{ x: 1, y: 1, w: 16, h: 16 }];
  context.api.refreshArtifactFlags();
  return context;
}

test("all three special enemy behaviors perform their configured action", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;

  const cultistContext = createAiContext(MT);
  const cultist = cultistContext.api.createEnemy("towerCultist", 7, 5, 8);
  cultist.markCooldownLeft = 0;
  cultistContext.state.enemies = [cultist];
  assert.equal(cultistContext.api.tryEnemySpecialAction(cultist), true);
  assert.equal(cultistContext.state.player.damageMarkBonus, 1);

  const guardContext = createAiContext(MT);
  const guard = guardContext.api.createEnemy("astralGuard", 10, 5, 12);
  guard.dashCooldownLeft = 0;
  guardContext.state.enemies = [guard];
  const oldGuardPosition = `${guard.x},${guard.y}`;
  assert.equal(guardContext.api.tryEnemySpecialAction(guard), true);
  assert.notEqual(`${guard.x},${guard.y}`, oldGuardPosition);

  const witchContext = createAiContext(MT);
  const witch = witchContext.api.createEnemy("voidWitch", 8, 5, 12);
  witch.hazardCooldownLeft = 0;
  witchContext.state.enemies = [witch];
  assert.equal(witchContext.api.tryEnemySpecialAction(witch), true);
  assert.equal(witchContext.state.hazards[0].sourceType, "voidWitch");
});

test("all three boss behavior handlers execute their special phase", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;

  const stoneContext = createAiContext(MT);
  stoneContext.state.floor = 5;
  const stone = stoneContext.api.createEnemy("stoneArchgolem", 10, 5, 5);
  stone.bossTimer = 3;
  stoneContext.state.enemies = [stone];
  stoneContext.api.actBoss(stone);
  assert.ok(stoneContext.state.enemies.some((enemy) => enemy.type === "smallGolem"));

  const mirrorContext = createAiContext(MT);
  mirrorContext.state.floor = 10;
  const mirror = mirrorContext.api.createEnemy("mirrorArchmage", 10, 5, 10);
  mirror.bossTimer = 3;
  mirrorContext.state.enemies = [mirror];
  mirrorContext.api.actBoss(mirror);
  assert.ok(mirrorContext.state.enemies.some((enemy) => enemy.type === "mirrorIllusion"));

  const avatarContext = createAiContext(MT);
  avatarContext.state.floor = 15;
  const avatar = avatarContext.api.createEnemy("towerAvatar", 10, 5, 15);
  avatar.hp = Math.floor(avatar.maxHp * 0.5);
  avatar.bossTimer = 2;
  avatar.shardCooldown = 0;
  avatarContext.state.enemies = [avatar];
  avatarContext.api.actBoss(avatar);
  assert.ok(avatarContext.state.enemies.some((enemy) => enemy.type === "towerShard"));
});
