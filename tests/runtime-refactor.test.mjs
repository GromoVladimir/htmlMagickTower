import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { loadClassicScripts } from "./helpers/classic-script-loader.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const INDEX_URL = new URL("../index.html", import.meta.url);
const GAME_URL = new URL("../game.js", import.meta.url);

let runtimePromise;

async function indexScriptSources() {
  const html = await readFile(INDEX_URL, "utf8");
  return [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)]
    .map((match) => match[1]);
}

async function loadPreBootstrapRuntime() {
  runtimePromise ||= (async () => {
    const scripts = await indexScriptSources();
    assert.equal(scripts.at(-1), "game.js", "game.js must remain the final classic script");
    return loadClassicScripts(scripts.slice(0, -1), { root: ROOT });
  })();
  return runtimePromise;
}

function createInstalledContext(MT, random, systemNames = ["core", "world"]) {
  const context = MT.runtime.context.createGameContext({
    data: MT.runtime.catalog,
    random,
  });
  systemNames.forEach((name) => MT.systems[name](context));
  return context;
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

function floorSignature(floorData) {
  const rooms = floorData.rooms
    .map(({ x, y, w, h }) => `${x},${y},${w},${h}`)
    .join("|");
  const map = floorData.map.map((row) => row.join("")).join("/");
  return `${rooms}::${floorData.start.x},${floorData.start.y}::${floorData.exit.x},${floorData.exit.y}::${map}`;
}

function assertFloorIsConnected(floorData, wallTile, floor) {
  const { map, rooms, start, exit } = floorData;
  const height = map.length;
  const width = map[0].length;
  const key = (x, y) => `${x},${y}`;
  const seen = new Set([key(start.x, start.y)]);
  const queue = [{ x: start.x, y: start.y }];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = current.x + dx;
      const y = current.y + dy;
      const cellKey = key(x, y);
      if (
        x < 0 || y < 0 || x >= width || y >= height ||
        map[y][x] === wallTile || seen.has(cellKey)
      ) {
        continue;
      }
      seen.add(cellKey);
      queue.push({ x, y });
    }
  }

  const walkableCells = map.reduce(
    (total, row) => total + row.filter((tile) => tile !== wallTile).length,
    0
  );

  assert.ok(rooms.length >= 6, `floor ${floor} must contain at least six rooms`);
  assert.notEqual(map[start.y][start.x], wallTile, `floor ${floor} start must be walkable`);
  assert.notEqual(map[exit.y][exit.x], wallTile, `floor ${floor} exit must be walkable`);
  assert.ok(seen.has(key(exit.x, exit.y)), `floor ${floor} exit must be reachable`);
  assert.equal(
    seen.size,
    walkableCells,
    `every carved cell on floor ${floor} must belong to one connected component`
  );

  rooms.forEach((room, index) => {
    const centerX = Math.floor(room.x + room.w / 2);
    const centerY = Math.floor(room.y + room.h / 2);
    assert.ok(
      seen.has(key(centerX, centerY)),
      `room ${index + 1} on floor ${floor} must be reachable from the start`
    );
  });
}

test("GameContext RNG drives deterministic inclusive randomInt results", async () => {
  const context = await loadPreBootstrapRuntime();
  const values = [0, 0.249999, 0.5, 0.999999999];
  let calls = 0;
  const game = createInstalledContext(
    context.MagicTower,
    () => values[calls++],
    ["core"]
  );

  assert.equal(game.rng.next(), 0);
  assert.equal(game.api.randomInt(10, 13), 10);
  assert.equal(game.api.randomInt(10, 13), 12);
  assert.equal(game.api.randomInt(10, 13), 13);
  assert.equal(calls, values.length);
});

test("seeded floor generation is deterministic and connected on all 15 floors", async () => {
  const context = await loadPreBootstrapRuntime();
  const MT = context.MagicTower;
  const first = createInstalledContext(MT, mulberry32(0xc0ffee));
  const second = createInstalledContext(MT, mulberry32(0xc0ffee));

  for (let floor = 1; floor <= MT.runtime.catalog.CONFIG.maxFloors; floor += 1) {
    const firstFloor = first.api.generateFloor(floor);
    const secondFloor = second.api.generateFloor(floor);

    assert.equal(
      floorSignature(firstFloor),
      floorSignature(secondFloor),
      `floor ${floor} must be reproducible from the same seeded RNG sequence`
    );
    assertFloorIsConnected(firstFloor, MT.runtime.catalog.TILES.WALL, floor);
  }
});

test("enemy factories isolate mutable instances and canonicalize the legacy boss alias", async () => {
  const context = await loadPreBootstrapRuntime();
  const MT = context.MagicTower;
  const game = createInstalledContext(MT, mulberry32(17));
  const first = game.api.createEnemy("skeleton", 2, 3, 4);
  const second = game.api.createEnemy("skeleton", 5, 6, 4);
  const skeletonDefinition = MT.runtime.catalog.getEnemy("skeleton");

  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.weakTo, second.weakTo);
  assert.notStrictEqual(first.tags, second.tags);
  assert.notStrictEqual(first.weakTo, skeletonDefinition.weakTo);
  assert.notStrictEqual(first.tags, skeletonDefinition.tags);

  first.hp = 0;
  first.slow = 9;
  first.weakTo.push("fire");
  first.tags.push("test-only");

  assert.ok(second.hp > 0);
  assert.equal(second.slow, 0);
  assert.equal(second.weakTo.includes("fire"), false);
  assert.equal(second.tags.includes("test-only"), false);
  assert.equal(skeletonDefinition.weakTo.includes("fire"), false);
  assert.equal(skeletonDefinition.tags.includes("test-only"), false);

  const legacyBoss = game.api.createEnemy("boss", 8, 8, 5);
  const canonicalBoss = game.api.createEnemy("stoneArchgolem", 9, 8, 5);

  assert.equal(legacyBoss.definitionId, "stoneArchgolem");
  assert.equal(legacyBoss.type, "stoneArchgolem");
  assert.equal(canonicalBoss.definitionId, "stoneArchgolem");
  assert.equal(legacyBoss.name, canonicalBoss.name);
  assert.equal(
    MT.runtime.catalog.getEnemy("boss"),
    MT.runtime.catalog.getBoss("stoneArchgolem")
  );
  assert.equal(new Set([first.id, second.id, legacyBoss.id, canonicalBoss.id]).size, 4);
});

test("player runtime state stores definition IDs and passive refreshes do not accumulate", async () => {
  const context = await loadPreBootstrapRuntime();
  const MT = context.MagicTower;
  const game = createInstalledContext(MT, () => 0, ["core", "progression"]);

  Object.assign(game.api, {
    generateFloor() {
      return {
        map: Array.from(
          { length: MT.runtime.catalog.CONFIG.mapHeight },
          () => Array(MT.runtime.catalog.CONFIG.mapWidth).fill(MT.runtime.catalog.TILES.WALL)
        ),
        rooms: [],
        startRoom: null,
        exitRoom: null,
        start: { x: 1, y: 1 },
        exit: { x: 2, y: 1 },
      };
    },
    placeFloorContent() {},
    updateVision() {},
    checkSecretEntranceProximity() {},
    updateUI() {},
    updateOverlay() {},
  });

  game.api.newGame();

  const player = game.state.player;
  assert.equal(typeof player.traitId, "string");
  assert.ok(MT.runtime.catalog.getTrait(player.traitId));
  assert.equal(Object.hasOwn(player, "trait"), false);

  const definition = MT.runtime.catalog.getArtifact("iceLens");
  game.api.addArtifactToPlayer(definition);
  const owned = player.artifacts.at(-1);

  assert.notStrictEqual(owned, definition);
  assert.equal(owned.definitionId, "iceLens");
  assert.equal(owned.active, true);
  assert.equal(owned.spent, false);
  assert.equal(Object.hasOwn(owned, "passives"), false);
  assert.equal(player.artifactFlags.floorStartShield, 1);

  const firstFlags = player.artifactFlags;
  game.api.refreshArtifactFlags();
  const secondFlags = player.artifactFlags;
  game.api.refreshArtifactFlags();
  const thirdFlags = player.artifactFlags;

  assert.notStrictEqual(firstFlags, secondFlags);
  assert.notStrictEqual(secondFlags, thirdFlags);
  assert.equal(secondFlags.floorStartShield, 1);
  assert.equal(thirdFlags.floorStartShield, 1);
});

test("behavior registries cover every spell, event, special enemy, and boss definition", async () => {
  const context = await loadPreBootstrapRuntime();
  const MT = context.MagicTower;
  const catalog = MT.runtime.catalog;
  const groups = [
    ["spells", Object.values(catalog.SPELLS)],
    ["events", Object.values(catalog.EVENT_ROOM_DEFINITIONS)],
    ["secretRewards", catalog.SECRET_REWARD_DEFINITIONS],
    ["enemies", Object.values(MT.data.enemies.ENEMY_TYPES).filter((entry) => entry.behaviorId)],
    ["bosses", Object.values(MT.data.bosses.BOSS_TYPES)],
  ];

  assert.deepEqual(groups.map(([, definitions]) => definitions.length), [9, 4, 6, 3, 3]);

  groups.forEach(([registryName, definitions]) => {
    const expectedIds = Array.from(definitions, (definition) => definition.behaviorId).sort();
    const registry = MT.behaviors[registryName];

    assert.deepEqual(
      Object.keys(registry).sort(),
      expectedIds,
      `${registryName} registry must match its content definitions`
    );
    definitions.forEach((definition) => {
      assert.equal(
        typeof registry[definition.behaviorId],
        "function",
        `${registryName}.${definition.behaviorId} must be a handler`
      );
    });
  });

  const spellCalls = [];
  const spellContext = {
    api: new Proxy(Object.create(null), {
      get(_target, property) {
        return (spell, evolution) => {
          spellCalls.push({ evolution, property, spell });
          return property;
        };
      },
    }),
  };
  Object.values(catalog.SPELLS).forEach((spell) => {
    const evolution = { id: `test-${spell.id}` };
    MT.behaviors.spells[spell.behaviorId](spellContext, spell, { evolution });
    assert.strictEqual(spellCalls.at(-1).spell, spell);
    assert.strictEqual(spellCalls.at(-1).evolution, evolution);
  });
  assert.equal(spellCalls.length, Object.keys(catalog.SPELLS).length);

  Object.values(catalog.EVENT_ROOM_DEFINITIONS).forEach((event) => {
    let receivedEvent = null;
    let receivedChoice = null;
    const eventContext = {
      api: new Proxy(Object.create(null), {
        get() {
          return (candidate, choiceId) => {
            receivedEvent = candidate;
            receivedChoice = choiceId;
          };
        },
      }),
    };
    MT.behaviors.events[event.behaviorId](eventContext, event, {
      choiceId: "test-choice",
    });
    assert.strictEqual(receivedEvent, event);
    assert.equal(receivedChoice, "test-choice");
  });

  Object.values(catalog.SECRET_REWARD_DEFINITIONS).forEach((reward) => {
    let receivedReward = null;
    const rewardContext = {
      api: new Proxy(Object.create(null), {
        get() {
          return (candidate) => {
            receivedReward = candidate;
            return true;
          };
        },
      }),
    };
    MT.behaviors.secretRewards[reward.behaviorId](rewardContext, reward, {});
    assert.strictEqual(receivedReward, reward);
  });

  for (const registryName of ["enemies", "bosses"]) {
    const calls = [];
    const behaviorContext = {
      api: new Proxy(Object.create(null), {
        get(_target, property) {
          return (entity) => {
            calls.push({ entity, property });
            return property;
          };
        },
      }),
    };
    const definitions = groups.find(([name]) => name === registryName)[1];
    definitions.forEach((definition) => {
      const entity = { definitionId: definition.id || definition.behaviorId };
      MT.behaviors[registryName][definition.behaviorId](behaviorContext, entity, {});
      assert.strictEqual(calls.at(-1).entity, entity);
    });
    assert.equal(calls.length, definitions.length);
  }
});

test("artifact hooks are indexed from definitions and run in deterministic priority order", async () => {
  const context = await loadPreBootstrapRuntime();
  const MT = context.MagicTower;
  const hooks = MT.behaviors.artifactHooks;
  const definitions = [
    ...MT.data.artifacts.ARTIFACTS,
    ...MT.data.artifacts.SECRET_ARTIFACTS,
    ...MT.data.artifacts.BOSS_RELICS,
  ];
  const declaredHooks = definitions.flatMap((definition) =>
    (definition.hooks || []).map((hook) => `${definition.id}/${hook.phase}/${hook.behaviorId}`)
  );
  const indexedHooks = Object.entries(hooks.phases).flatMap(([phase, entries]) =>
    Array.from(entries, (entry) => `${entry.artifactId}/${phase}/${entry.behaviorId}`)
  );

  assert.deepEqual([...indexedHooks].sort(), [...declaredHooks].sort());

  Object.entries(hooks.phases).forEach(([phase, entries]) => {
    const priorities = Array.from(entries, (entry) => entry.priority);
    assert.deepEqual(priorities, [...priorities].sort((a, b) => a - b), `${phase} priorities`);
    assert.equal(
      new Set(Array.from(entries, (entry) => `${entry.artifactId}/${entry.behaviorId}`)).size,
      entries.length
    );
    entries.forEach((entry) => assert.strictEqual(entry.handler, hooks.handlers[entry.behaviorId]));
  });

  const calls = [];
  const hookContext = {
    state: {
      player: {
        artifacts: ["galeFeather", "bastionShard", "reflectionShard"].map((definitionId) => ({
          definitionId,
          active: true,
          spent: false,
        })),
      },
    },
    api: {
      applyDamageShieldArtifact: () => calls.push("damageShield"),
      applyBastionShardRelic: () => calls.push("bastionShard"),
      applyReflectionShardRelic: () => calls.push("reflectionShard"),
    },
  };
  hooks.run(hookContext, "afterDamageTaken", { sourceEnemy: { id: 7 } });
  assert.deepEqual(calls, ["damageShield", "bastionShard", "reflectionShard"]);

  hookContext.state.player.artifacts = [];
  hooks.run(hookContext, "afterDamageTaken", { sourceEnemy: { id: 8 } });
  assert.deepEqual(calls, ["damageShield", "bastionShard", "reflectionShard"]);
});

test("artifact cost and echo hooks consume aggregated passives only once", async () => {
  const context = await loadPreBootstrapRuntime();
  const hooks = context.MagicTower.behaviors.artifactHooks;
  let flagReads = 0;
  const hookContext = {
    state: {
      player: {
        spellsCastThisFloor: 0,
        lastSpellElement: "fire",
        glassMemoryDiscountAvailable: true,
        artifacts: [
          "archmageVessel",
          "sevenElementsCrown",
          "glassMemory",
          "firstMageMirror",
          "mirrorFocusRelic",
        ].map((definitionId) => ({ definitionId, active: true, spent: false })),
      },
    },
    api: {
      artifactFlags() {
        flagReads += 1;
        return {
          firstSpellDiscount: 1,
          alternatingElementDiscount: 1,
          glassMemoryDiscount: 1,
          firstSpellEcho: true,
          firstSpellEchoMessage: "echo",
          firstSpellEchoManaRefund: 1,
        };
      },
    },
  };

  const costParams = { spell: { element: "ice" }, discount: 0 };
  hooks.run(hookContext, "spellCost", costParams);
  assert.equal(costParams.discount, 3);
  assert.equal(flagReads, 3);

  const castParams = { spell: { element: "ice" }, shouldEcho: false };
  hooks.run(hookContext, "beforeSpellCast", castParams);
  assert.equal(castParams.shouldEcho, true);
  assert.equal(castParams.echoMessage, "echo");
  assert.equal(castParams.echoManaRefund, 1);
  assert.equal(flagReads, 4, "shared echo behavior must run once for aggregated passives");
});

test("game.js is a bootstrap only, without content, AI, or canvas drawing implementations", async () => {
  const source = await readFile(GAME_URL, "utf8");
  const declaredFunctions = [...source.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)]
    .map((match) => match[1]);

  assert.deepEqual(
    declaredFunctions,
    ["bootstrapMagicTower", "newGame", "startFloor", "dispatchKey", "renderFrame"]
  );
  assert.doesNotMatch(
    source,
    /\b(?:const|let|var)\s+(?:CONFIG|SPELLS|TRAITS|ARTIFACTS|SECRET_ARTIFACTS|BOSS_RELICS|ENEMY_TYPES|BOSS_TYPES|FLOOR_RULES|EVENT_ROOM_DEFINITIONS)\b/
  );
  assert.doesNotMatch(
    source,
    /\b(?:generateFloor|createEnemy|castSpell|actEnemies|actStandardEnemy|actStoneArchgolem|actMirrorArchmage|actTowerAvatar|tryCultistMark|tryAstralDash|tryVoidWitchHazard)\s*(?:=|\()/
  );
  assert.doesNotMatch(
    source,
    /\b(?:clearRect|fillRect|strokeRect|fillText|drawImage|beginPath|moveTo|lineTo|arc|stroke|fill)\s*\(/
  );
  assert.doesNotMatch(source, /\bMath\.random\b/);
  assert.match(source, /MagicTower\.runtime\.context\.createGameContext\s*\(/);
  assert.match(source, /MagicTower\.registerRuntime\("game"/);
});
