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

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createWorldContext(MT, seed) {
  const context = MT.runtime.context.createGameContext({
    data: MT.runtime.catalog,
    random: mulberry32(seed),
  });
  ["core", "world", "progression", "events", "spells", "combat", "enemyAi", "bossAi"]
    .forEach((name) => MT.systems[name](context));
  Object.assign(context.api, {
    addEffect() {},
    advanceTurn() {},
    updateOverlay() {},
    updateUI() {},
  });
  context.state.player = context.api.createPlayer();
  context.state.mode = context.data.MODES.PLAYING;
  return context;
}

function prepareFloor(context, floor) {
  const floorData = context.api.generateFloor(floor);
  Object.assign(context.state, {
    floor,
    map: floorData.map,
    rooms: floorData.rooms,
    enemies: [],
    objects: [],
    hazards: [],
    barriers: [],
    effects: [],
    secretRoomDiscovered: false,
    secretRoomOpened: false,
    secretRewardClaimed: false,
    secretEntranceId: null,
    activeChallenge: null,
  });
  context.state.player.x = floorData.start.x;
  context.state.player.y = floorData.start.y;
  context.api.placeFloorContent(floorData);
  return floorData;
}

test("floor content placement respects all 15 floor definitions", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;
  const context = createWorldContext(MT, 0x51a7e);

  for (let floor = 1; floor <= context.data.CONFIG.maxFloors; floor += 1) {
    prepareFloor(context, floor);
    const rules = context.data.FLOOR_RULES[floor];
    const bossId = context.data.BOSSES_BY_FLOOR[floor];
    const stairs = context.state.objects.filter((object) => object.type === context.data.EVENT_TYPES.STAIRS);
    const bosses = context.state.enemies.filter((enemy) => enemy.boss);

    assert.equal(stairs.length, rules.stairs ? 1 : 0, `floor ${floor} stairs`);
    assert.equal(bosses.length, bossId ? 1 : 0, `floor ${floor} boss count`);
    if (bossId) {
      assert.equal(bosses[0].definitionId, bossId, `floor ${floor} boss id`);
    }
    assert.ok(
      context.state.enemies.filter((enemy) => !enemy.boss).length <= rules.enemyCount,
      `floor ${floor} enemy placement must not exceed its rule`
    );

    context.state.enemies.forEach((enemy) => {
      assert.notEqual(context.state.map[enemy.y][enemy.x], context.data.TILES.WALL);
      assert.ok(context.data.getEnemy(enemy.definitionId));
    });
    context.state.objects.forEach((object) => {
      assert.ok(object.x >= 0 && object.x < context.data.CONFIG.mapWidth);
      assert.ok(object.y >= 0 && object.y < context.data.CONFIG.mapHeight);
      if (object.type !== context.data.EVENT_TYPES.SECRET_ENTRANCE) {
        assert.notEqual(context.state.map[object.y][object.x], context.data.TILES.WALL);
      }
    });
  }
});

test("secret entrance and altar complete their full reward flow", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;
  const context = createWorldContext(MT, 0x5ec2e7);
  const floor = 6;
  const floorData = context.api.generateFloor(floor);
  Object.assign(context.state, {
    floor,
    map: floorData.map,
    rooms: floorData.rooms,
    enemies: [],
    objects: [],
    hazards: [],
    barriers: [],
    effects: [],
    secretRoomDiscovered: false,
    secretRoomOpened: false,
    secretRewardClaimed: false,
    secretEntranceId: null,
  });
  context.state.player.x = floorData.start.x;
  context.state.player.y = floorData.start.y;
  context.rng.next = () => 0;
  context.api.placeFloorContent(floorData);

  const entrance = context.state.objects.find(
    (object) => object.type === context.data.EVENT_TYPES.SECRET_ENTRANCE
  );
  const altar = context.state.objects.find(
    (object) => object.type === context.data.EVENT_TYPES.SECRET_ALTAR
  );
  assert.ok(entrance, "eligible floor must place a forced secret entrance");
  assert.ok(altar, "secret room must contain its altar");
  assert.equal(context.api.openSecretEntrance(entrance, "test"), true);
  assert.equal(context.state.map[entrance.y][entrance.x], context.data.TILES.FLOOR);

  const oldArtifactCount = context.state.player.artifacts.length;
  context.api.openSecretRewardChoice(altar);
  assert.equal(context.state.mode, context.data.MODES.SECRET_REWARD_CHOICE);
  assert.equal(context.state.pendingSecretRewardChoices.length, 3);
  context.api.chooseSecretReward(0);
  assert.equal(altar.used, true);
  assert.equal(context.state.secretRewardClaimed, true);
  assert.equal(context.state.player.artifacts.length, oldArtifactCount + 1);
});
