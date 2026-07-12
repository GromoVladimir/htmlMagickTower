import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createBrowserDoubles } from "./helpers/browser-doubles.mjs";
import { createClassicContext, loadClassicScripts } from "./helpers/classic-script-loader.mjs";

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function floorSnapshot(state) {
  return {
    floor: state.floor,
    idCounter: state.idCounter,
    player: { x: state.player.x, y: state.player.y },
    rooms: Array.from(state.rooms, (room) => ({ x: room.x, y: room.y, w: room.w, h: room.h })),
    map: Array.from(state.map, (row) => Array.from(row).join("")),
    enemies: Array.from(state.enemies, (enemy) => ({
      id: enemy.id,
      definitionId: enemy.definitionId,
      x: enemy.x,
      y: enemy.y,
      hp: enemy.hp,
    })),
    objects: Array.from(state.objects, (object) => ({
      id: object.id,
      type: object.type,
      definitionId: object.definitionId || null,
      x: object.x,
      y: object.y,
    })),
  };
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

test("seeded full-run goldens preserve RNG call counts and ordering", async () => {
  const html = await readFile("index.html", "utf8");
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)]
    .map((match) => match[1]);
  const doubles = createBrowserDoubles();
  const seeded = mulberry32(0x5eed1234);
  let calls = 0;
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => {
    calls += 1;
    return seeded();
  };
  const context = createClassicContext({ ...doubles.globals, Math: deterministicMath });
  await loadClassicScripts(scripts, { context });

  doubles.document.getElementById("primaryAction").dispatch("click");
  const runtime = context.MagicTower.runtime.game;
  const initial = runtime.getState();
  const initialFloorSnapshot = floorSnapshot(initial);
  const initialSnapshot = {
    idCounter: initial.idCounter,
    floor: initial.floor,
    traitId: initial.player.traitId,
    spells: Array.from(initial.player.spells),
    player: {
      x: initial.player.x,
      y: initial.player.y,
      hp: initial.player.hp,
      mana: initial.player.mana,
    },
    rooms: initialFloorSnapshot.rooms,
    map: initialFloorSnapshot.map,
    enemies: initialFloorSnapshot.enemies,
    objects: initialFloorSnapshot.objects,
  };
  assert.deepEqual(
    {
      calls,
      digest: digest(initialSnapshot),
      traitId: initial.player.traitId,
      spells: Array.from(initial.player.spells),
      enemies: initial.enemies.length,
      objects: initial.objects.length,
      idCounter: initial.idCounter,
    },
    {
      calls: 262,
      digest: "01aee72043f77b18f20d8f09bf8f59dd748d06eb3008cfb0b1dd774962e2be5b",
      traitId: "frugalMage",
      spells: ["fireball"],
      enemies: 4,
      objects: 7,
      idCounter: 12,
    }
  );

  const actualFloors = [];
  for (let floor = 1; floor <= 15; floor += 1) {
    const callsBefore = calls;
    runtime.startFloor(floor);
    actualFloors.push({
      floor,
      calls: calls - callsBefore,
      digest: digest(floorSnapshot(runtime.getState())),
    });
  }

  assert.deepEqual(actualFloors, [
    { floor: 1, calls: 563, digest: "70a72bc6c5a5567d7163bee498de9fad2ae8ab29af1591d30216f979d42b0dd9" },
    { floor: 2, calls: 566, digest: "781646f14123abd3e854b1775405ac4fc6c9fae712d7d75f526b2ef7c2131d23" },
    { floor: 3, calls: 574, digest: "8b58141584cdcedb766e2ee5482423217308447bb7152b7853a7e9208aadbccc" },
    { floor: 4, calls: 578, digest: "894fb065d8e25b0030964656e735bd47f7f9b2e1b6863e9755f6561335c49dee" },
    { floor: 5, calls: 113, digest: "3efa70c24c97ee4e7dfc36b28e5df12130c0c148fd40a80e383aa5fb31c98b12" },
    { floor: 6, calls: 584, digest: "d6ebf30259f4a1fb518a6c49bc4dff8430da7ae15ea458a5a3d37e23437c5e9d" },
    { floor: 7, calls: 577, digest: "1c566ac26de577673a7988d6bfa924d7580d0f6144fff430cfc46ad44f67319b" },
    { floor: 8, calls: 603, digest: "05bea209e1e295d7c2487b36a269f1220907b96c01e09fadad3e37947efb995a" },
    { floor: 9, calls: 585, digest: "783139a3a919f49cc62f3c32c8b98639e600a470005aaae7a22ac15fbbffe242" },
    { floor: 10, calls: 125, digest: "9793f791732f3074e16e47c0db73b7ecb5791423588d95b03e23eb362263bfc9" },
    { floor: 11, calls: 584, digest: "0f2c0a4b1adcaad979dbc67376ee4eabfc990fd39089231d0a2748ff0307e5eb" },
    { floor: 12, calls: 590, digest: "7ef869ded0bbecb35f420c3ebbd261da99f611160244af531eaeed83bed5b365" },
    { floor: 13, calls: 593, digest: "1e4bf85e6f54f8ab87c6741db21de2bd010290e1a54de67fa48671f36fe68edf" },
    { floor: 14, calls: 595, digest: "6045b4fe96b12391aff5d3bdecb807d6e552ce0258e5897d6c4d6d661676b3ab" },
    { floor: 15, calls: 141, digest: "3f9df8acd7ab20d1d646577e06d73dcc8581fec1e847f6c1c56b03327f27b4ba" },
  ]);
});
