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

function createEventContext(MT) {
  const context = MT.runtime.context.createGameContext({
    data: MT.runtime.catalog,
    random: () => 0,
  });
  ["core", "world", "progression", "events", "spells", "combat", "enemyAi", "bossAi"]
    .forEach((name) => MT.systems[name](context));
  Object.assign(context.api, {
    addEffect() {},
    advanceTurn() {},
    updateOverlay() {},
    updateUI() {},
    updateVision() {},
  });

  const { data, state } = context;
  state.mode = data.MODES.PLAYING;
  state.floor = 8;
  state.player = context.api.createPlayer();
  state.player.x = 5;
  state.player.y = 5;
  state.player.hp = state.player.maxHp;
  state.player.mana = 0;
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
  state.rooms = [{ x: 1, y: 1, w: 12, h: 12 }];
  context.api.refreshArtifactFlags();
  return context;
}

const eventChoiceIds = {
  mirrorLibrary: ["mirrorShard", "mirrorSwap", "mirrorPower"],
  cursedAltar: ["altarRareCurse", "altarHeal", "altarSacrifice"],
  manaFountain: ["fountainMana", "fountainMaxMana", "fountainCleanse"],
  trialRoom: ["trialStart", "trialDecline"],
};

test("every event-room choice is generated and handled by its event behavior", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;
  let handled = 0;

  for (const [eventId, choiceIds] of Object.entries(eventChoiceIds)) {
    const preview = createEventContext(MT);
    const previewEvent = {
      id: 500,
      type: preview.data.EVENT_TYPES.EVENT_ROOM,
      eventId,
      x: 5,
      y: 5,
      used: false,
      trialReward: { type: "heal", amount: 3 },
    };
    assert.equal(
      preview.api.eventChoices(previewEvent).map((choice) => choice.id).join(","),
      choiceIds.join(","),
      `${eventId} must expose its complete ordered choice list`
    );

    for (const choiceId of choiceIds) {
      const context = createEventContext(MT);
      const event = {
        id: 500 + handled,
        type: context.data.EVENT_TYPES.EVENT_ROOM,
        eventId,
        x: 5,
        y: 5,
        used: false,
        trialReward: { type: "heal", amount: 3 },
      };
      context.state.objects = [event];
      if (choiceId === "fountainCleanse") {
        context.api.addWeakCurse("manaCrack");
      }

      const result = context.api.applyEventChoice(event, choiceId);
      assert.equal(result, true, `${eventId}/${choiceId} must be handled`);
      assert.equal(event.used, true, `${eventId}/${choiceId} must consume the room`);
      handled += 1;
    }
  }

  assert.equal(handled, 11);
});

test("every secret reward dispatches through its registered handler", async () => {
  const vmContext = await loadRuntime();
  const MT = vmContext.MagicTower;

  for (const reward of MT.runtime.catalog.SECRET_REWARD_DEFINITIONS) {
    const context = createEventContext(MT);
    const before = {
      artifacts: context.state.player.artifacts.length,
      hp: context.state.player.maxHp,
      mana: context.state.player.maxMana,
      shards: context.state.player.magicShards,
    };
    const result = context.api.applySecretReward(reward);
    assert.equal(result, true, `${reward.id} must be granted`);

    if (reward.id === "forgottenArchmageKey" || reward.id === "secretArtifact") {
      assert.ok(context.state.player.artifacts.length > before.artifacts);
    }
    if (reward.id === "pureMagicShard") {
      assert.equal(context.state.player.magicShards, before.shards + 1);
    }
    if (reward.id === "lifeSpring") {
      assert.equal(context.state.player.maxHp, before.hp + 1);
    }
    if (reward.id === "cleansingSeal") {
      assert.equal(context.state.player.maxMana, before.mana + 1);
    }
  }
});
