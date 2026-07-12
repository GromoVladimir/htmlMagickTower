// Core rules, progression-independent helpers, and run/floor lifecycle.
(function registerCoresystem(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerSystem !== "function") {
    throw new Error("MagicTower.registerSystem must load before js/systems/core.js");
  }

  /**
   * Installs the core API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installCore(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("core requires a GameContext with an api object.");
    }
    const state = context.state;
    const dom = context.dom;
    const canvasContext = context.canvasContext;
    const data = context.data;
    const ctx = canvasContext;
    const effectBehaviors = context.behaviors && context.behaviors.effects;
    const effectContext = context.effectContext || context;
    const {
      CONFIG,
      MODES,
      SPELLS,
      MAX_SPELL_LEVEL,
      EVOLUTION_COST,
      SPELL_UPGRADES,
      SPELL_EVOLUTIONS,
      TRAITS,
      ARTIFACTS,
      SECRET_ARTIFACTS,
      BOSS_RELICS,
      ENEMY_TYPES,
      ACTS,
      FLOOR_RULES,
      BOSSES_BY_FLOOR,
      ENEMY_POOLS_BY_ACT,
      ARTIFACT_POOLS_BY_ACT,
      REWARD_RULES,
      MAGIC_SHARD_REWARDS,
      EVENT_TYPES,
      WEAK_CURSE_TYPES,
    } = data;

    function generateFloor(...args) {
      const implementation = context.api.generateFloor;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function generateFloor is not installed.");
      }
      return implementation(...args);
    }

    function placeFloorContent(...args) {
      const implementation = context.api.placeFloorContent;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function placeFloorContent is not installed.");
      }
      return implementation(...args);
    }

    function updateVision(...args) {
      const implementation = context.api.updateVision;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function updateVision is not installed.");
      }
      return implementation(...args);
    }

    function checkSecretEntranceProximity(...args) {
      const implementation = context.api.checkSecretEntranceProximity;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function checkSecretEntranceProximity is not installed.");
      }
      return implementation(...args);
    }

    function addArtifactToPlayer(...args) {
      const implementation = context.api.addArtifactToPlayer;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function addArtifactToPlayer is not installed.");
      }
      return implementation(...args);
    }

    function updateUI(...args) {
      const implementation = context.api.updateUI;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function updateUI is not installed.");
      }
      return implementation(...args);
    }

    function updateOverlay(...args) {
      const implementation = context.api.updateOverlay;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function updateOverlay is not installed.");
      }
      return implementation(...args);
    }

    function randomInt(min, max) {
      return Math.floor(context.rng.next() * (max - min + 1)) + min;
    }

    function sample(list) {
      return list[Math.floor(context.rng.next() * list.length)];
    }

    function sampleWeighted(entries) {
      const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
      let roll = context.rng.next() * total;
      for (const entry of entries) {
        roll -= entry.weight;
        if (roll <= 0) {
          return entry;
        }
      }
      return entries[entries.length - 1];
    }

    function cssClassToken(value) {
      return String(value).replace(/[A-Z]/g, "-$&").toLowerCase();
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function distance(a, b) {
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    function nextId() {
      return context.ids.next();
    }

    function changeMaxHp(player, amount) {
      player.maxHp = Math.max(1, player.maxHp + amount);
      if (amount > 0) {
        player.hp += amount;
      }
      player.hp = clamp(player.hp, 1, player.maxHp);
    }

    function changeMaxMana(player, amount) {
      player.maxMana = Math.max(1, player.maxMana + amount);
      if (amount > 0) {
        player.mana += amount;
      }
      player.mana = clamp(player.mana, 0, player.maxMana);
    }

    function spellCost(spell) {
      const evolution = spellEvolution(spell.id);
      const evolutionCost = evolution?.costModifier || 0;
      const costParams = { spell, discount: 0 };
      context.behaviors.artifactHooks.run(context, "spellCost", costParams);
      return Math.max(
        0,
        spell.cost + (state.player?.spellCostModifier || 0) + evolutionCost - costParams.discount
      );
    }

    function spellLevel(spellId) {
      if (!state.player) {
        return SPELLS[spellId]?.level || 1;
      }
      return state.player.spellLevels[spellId] || SPELLS[spellId]?.level || 1;
    }

    function nextSpellUpgrade(spellId) {
      const nextLevel = spellLevel(spellId) + 1;
      return SPELL_UPGRADES[spellId]?.[nextLevel] || null;
    }

    function evolutionOptions(spellId) {
      return SPELL_EVOLUTIONS[spellId] || [];
    }

    function evolutionById(spellId, evolutionId) {
      return evolutionOptions(spellId).find((evolution) => evolution.id === evolutionId) || null;
    }

    function spellEvolution(spellId) {
      if (!state.player?.spellEvolutions) {
        return null;
      }
      return evolutionById(spellId, state.player.spellEvolutions[spellId]);
    }

    function hasEvolution(spellId) {
      return Boolean(spellEvolution(spellId));
    }

    function playerSpellEvolution(player, spellId) {
      if (!player?.spellEvolutions) {
        return null;
      }
      return evolutionById(spellId, player.spellEvolutions[spellId]);
    }

    function hasElementSpell(player, element) {
      return Boolean(player?.spells?.some((spellId) => SPELLS[spellId]?.element === element));
    }

    function hasElementEvolution(player, element) {
      return Boolean(player?.spells?.some((spellId) =>
        SPELLS[spellId]?.element === element && playerSpellEvolution(player, spellId)
      ));
    }

    function createArtifactFlags() {
      return effectBehaviors.createArtifactFlags();
    }

    function activeOwnedArtifacts(player = state.player) {
      return (player?.artifacts || []).filter((artifact) => artifact.active !== false && !artifact.spent);
    }

    function ownedArtifactById(id, player = state.player) {
      const artifacts = player?.artifacts || [];
      const matches = (artifact) => (artifact.definitionId || artifact.id) === id;
      return artifacts.find((artifact) => matches(artifact) && artifact.active !== false && !artifact.spent) ||
        artifacts.find(matches);
    }

    function refreshArtifactFlags(player = state.player) {
      if (!player) {
        return createArtifactFlags();
      }
      const definitions = activeOwnedArtifacts(player)
        .map((ownedArtifact) => artifactById(ownedArtifact.definitionId || ownedArtifact.id))
        .filter(Boolean);
      return effectBehaviors.recomputePassives(effectContext, player, {
        definitions,
        assignTo: "artifactFlags",
      });
    }

    function artifactFlags() {
      return state.player?.artifactFlags || createArtifactFlags();
    }

    function spellUpgradeDiscount() {
      return Math.max(0, state.player?.spellUpgradeDiscount || 0);
    }

    function discountedShardCost(baseCost) {
      return Math.max(0, baseCost - spellUpgradeDiscount());
    }

    function consumeSpellUpgradeDiscount(baseCost) {
      const discount = Math.min(spellUpgradeDiscount(), baseCost);
      if (discount <= 0) {
        return 0;
      }
      state.player.spellUpgradeDiscount = 0;
      addLog(`Ключ забытого архимага снижает стоимость на ${discount} осколок.`);
      return discount;
    }

    function upgradeCost(upgrade) {
      return discountedShardCost(upgrade?.cost || 0);
    }

    function currentEvolutionCost() {
      return discountedShardCost(EVOLUTION_COST);
    }

    function canEvolveSpell(spellId) {
      return Boolean(
        state.player &&
        spellLevel(spellId) >= MAX_SPELL_LEVEL &&
        !hasEvolution(spellId) &&
        evolutionOptions(spellId).length &&
        state.player.magicShards >= currentEvolutionCost()
      );
    }

    function spellUpgradeTotal(spellId, key) {
      const upgrades = SPELL_UPGRADES[spellId] || {};
      let total = 0;
      for (let level = 2; level <= spellLevel(spellId); level += 1) {
        total += upgrades[level]?.[key] || 0;
      }
      return total;
    }

    function spellUpgradeOverride(spellId, key, fallback) {
      const upgrades = SPELL_UPGRADES[spellId] || {};
      let value = fallback;
      for (let level = 2; level <= spellLevel(spellId); level += 1) {
        if (Object.prototype.hasOwnProperty.call(upgrades[level] || {}, key)) {
          value = upgrades[level][key];
        }
      }
      return value;
    }

    function grantMagicShardReward(key, message) {
      if (!state.player || state.player.claimedMagicShardRewards[key]) {
        return false;
      }
      state.player.claimedMagicShardRewards[key] = true;
      state.player.magicShards += 1;
      addLog(`${message} +1 осколок магии.`);
      return true;
    }

    function grantFloorMagicShardReward(floor) {
      const message = MAGIC_SHARD_REWARDS.floors[floor];
      if (message) {
        grantMagicShardReward(`floor:${floor}`, message);
      }
    }

    function grantBossMagicShardReward(floor) {
      const message = MAGIC_SHARD_REWARDS.bosses[floor];
      if (message) {
        grantMagicShardReward(`boss:${floor}`, message);
      }
    }

    function createFlagMap(value = false) {
      return Array.from({ length: CONFIG.mapHeight }, () =>
        Array.from({ length: CONFIG.mapWidth }, () => value)
      );
    }

    function artifactById(id) {
      return data.getArtifact(id);
    }

    function getActForFloor(floor) {
      return ACTS.find((act) => floor >= act.floorRange[0] && floor <= act.floorRange[1]) || ACTS[0];
    }

    function getFloorRules(floor = state.floor) {
      return FLOOR_RULES[floor] || FLOOR_RULES[CONFIG.maxFloors];
    }

    function getEnemyPoolForFloor(floor) {
      const act = getActForFloor(floor);
      const pool = ENEMY_POOLS_BY_ACT[act.enemyPool];
      return pool?.byFloor?.[floor] || pool?.default || [];
    }

    function getArtifactPoolConfigForFloor(floor) {
      const act = getActForFloor(floor);
      return ARTIFACT_POOLS_BY_ACT[act.artifactPool] || ARTIFACT_POOLS_BY_ACT[act.id];
    }

    function chooseArtifactTier(floor) {
      const pool = getArtifactPoolConfigForFloor(floor);
      const tierWeights = pool?.tierWeights || [{ tier: 1, weight: 1 }];
      return sampleWeighted(tierWeights).tier;
    }

    function getArtifactPoolForFloor(floor, cursed, tier = null) {
      const pool = getArtifactPoolConfigForFloor(floor);
      const tierWeights = pool?.tierWeights || [{ tier: 1, weight: 1 }];
      const allowedTiers = tierWeights.map((entry) => entry.tier);
      const tiers = tier ? [tier] : allowedTiers;
      const artifacts = ARTIFACTS.filter((artifact) =>
        artifact.rarity !== "bossRelic" &&
        artifact.cursed === cursed &&
        tiers.includes(artifact.tier)
      );
      if (artifacts.length || !tier) {
        return artifacts;
      }
      return ARTIFACTS.filter((artifact) =>
        artifact.rarity !== "bossRelic" &&
        artifact.cursed === cursed &&
        allowedTiers.includes(artifact.tier)
      );
    }

    function chooseArtifact(cursed) {
      const tier = chooseArtifactTier(state.floor);
      const pool = getArtifactPoolForFloor(state.floor, cursed, tier);
      const uncollected = pool.filter((artifact) =>
        !state.player.artifacts.some((owned) => (owned.definitionId || owned.id) === artifact.id)
      );
      if (uncollected.length) {
        return sample(uncollected);
      }
      const actPool = getArtifactPoolForFloor(state.floor, cursed);
      const actUncollected = actPool.filter((artifact) =>
        !state.player.artifacts.some((owned) => (owned.definitionId || owned.id) === artifact.id)
      );
      const fallbackPool = ARTIFACTS.filter((artifact) =>
        artifact.rarity !== "bossRelic" &&
        artifact.cursed === cursed
      );
      return sample(actUncollected.length ? actUncollected : pool.length ? pool : fallbackPool);
    }

    function chooseEventArtifact(options = {}) {
      const cursed = Boolean(options.cursed);
      const rarities = options.rarities || null;
      const matches = (artifact) =>
        artifact.rarity !== "bossRelic" &&
        artifact.cursed === cursed &&
        (!rarities || rarities.includes(artifact.rarity));
      const tier = chooseArtifactTier(state.floor);
      const pools = [
        getArtifactPoolForFloor(state.floor, cursed, tier).filter(matches),
        getArtifactPoolForFloor(state.floor, cursed).filter(matches),
        ARTIFACTS.filter(matches),
      ];

      for (const pool of pools) {
        const uncollected = pool.filter((artifact) =>
          !state.player.artifacts.some((owned) => (owned.definitionId || owned.id) === artifact.id)
        );
        if (uncollected.length) {
          return sample(uncollected);
        }
        if (pool.length) {
          return sample(pool);
        }
      }

      return null;
    }

    function grantArtifactReward(artifact, sourceText = "Артефакт") {
      if (!artifact) {
        addLog("Башня не нашла подходящий артефакт для награды.");
        return false;
      }

      addArtifactToPlayer(artifact);
      addLog(`${sourceText}: ${artifact.name}. ${artifact.bonusText}`);
      return true;
    }

    function addWeakCurse(curseId = "manaCrack") {
      const curse = WEAK_CURSE_TYPES[curseId];
      if (!curse || !state.player) {
        return false;
      }

      const beforeMaxMana = state.player.maxMana;
      changeMaxMana(state.player, -1);
      const manaPenalty = beforeMaxMana - state.player.maxMana;
      state.player.curses.push({
        id: curse.id,
        name: curse.name,
        description: curse.description,
        manaPenalty,
      });
      addLog(`Слабое проклятие: ${curse.name}. ${curse.description}`);
      return true;
    }

    function removeWeakCurse(sourceText = "Фонтан смывает проклятие") {
      if (!state.player?.curses?.length) {
        addLog("Слабых проклятий нет.");
        return false;
      }

      const curse = state.player.curses.shift();
      if (curse.manaPenalty > 0) {
        changeMaxMana(state.player, curse.manaPenalty);
      }
      addLog(`${sourceText}: ${curse.name}.`);
      return true;
    }

    function chooseChallengeReward() {
      const reward = sampleWeighted([
        { type: "artifact", weight: 0.55 },
        { type: "heal", amount: 3, weight: 0.3 },
        { type: "shard", amount: 1, weight: 0.15 },
      ]);
      return { type: reward.type, amount: reward.amount || 1 };
    }

    function describeChallengeReward(reward) {
      if (!reward) {
        return "награда башни";
      }
      if (reward.type === "artifact") {
        return "артефакт текущего акта";
      }
      if (reward.type === "heal") {
        return `лечение ${reward.amount} здоровья`;
      }
      if (reward.type === "shard") {
        return "+1 осколок магии";
      }
      return "награда башни";
    }

    function chooseBossRelicOptions(floor) {
      const collectedIds = new Set(
        state.player.artifacts.map((artifact) => artifact.definitionId || artifact.id)
      );
      const pool = BOSS_RELICS.filter((relic) =>
        relic.bossFloor === floor &&
        !collectedIds.has(relic.id)
      );
      const options = [];
      while (pool.length && options.length < 3) {
        options.push(pool.splice(randomInt(0, pool.length - 1), 1)[0].id);
      }
      return options;
    }

    function spawnBossStairs(exit) {
      state.objects.push({
        id: nextId(),
        type: EVENT_TYPES.STAIRS,
        x: exit.x,
        y: exit.y,
      });
      updateVision();
      addLog("После победы над стражем открывается переход выше.");
    }

    function clearBossExitCell(exit) {
      const isExitCell = (item) => item.x === exit.x && item.y === exit.y;
      state.objects = state.objects.filter((object) => !isExitCell(object));
      state.hazards = state.hazards.filter((hazard) => !isExitCell(hazard));
      state.barriers = state.barriers.filter((barrier) => !isExitCell(barrier));
    }

    function openBossRelicChoice(floor, exit) {
      const choices = chooseBossRelicOptions(floor);
      if (!choices.length) {
        return false;
      }

      state.pendingBossRelicChoices = choices;
      state.pendingBossRelicExit = { x: exit.x, y: exit.y };
      state.pendingBossRelicFloor = floor;
      addLog("Сила поверженного босса принимает форму реликвий. Выберите одну.");
      setMode(MODES.RELIC_CHOICE);
      return true;
    }

    function addLog(message) {
      state.logs.push(message);
      state.logs = state.logs.slice(-CONFIG.logLimit);
      updateUI();
    }

    function setMode(mode) {
      state.mode = mode;
      if (mode !== MODES.PLAYING) {
        state.upgradeMode = false;
        state.evolutionChoiceSpellId = null;
        state.evolutionChoiceSlotIndex = null;
      }
      updateOverlay();
      updateUI();
    }

    function createPlayer() {
      return {
        x: 0,
        y: 0,
        hp: CONFIG.basePlayer.hp,
        maxHp: CONFIG.basePlayer.maxHp,
        mana: CONFIG.basePlayer.mana,
        maxMana: CONFIG.basePlayer.maxMana,
        shield: 0,
        staffDamage: CONFIG.basePlayer.staffDamage,
        spells: ["fireball"],
        spellLevels: { fireball: 1 },
        spellEvolutions: {},
        magicShards: 0,
        claimedMagicShardRewards: {},
        selectedSpell: 0,
        flatSpellBonus: 0,
        floorSpellDamageBonus: 0,
        spellDamageMultiplier: 1,
        spellCostModifier: 0,
        spellUpgradeDiscount: 0,
        elementBonus: {},
        manaRegenEvery: CONFIG.manaRegenEvery,
        blocksFirstHit: false,
        floorBlockAvailable: false,
        revealsSecrets: false,
        freeFirstSpell: false,
        freeSpellAvailable: false,
        poisonBonusTurns: 0,
        lightHealBonus: 0,
        shadowWoundBonus: 0,
        earthShieldBonus: 0,
        windPushBonus: 0,
        damageReduction: 0,
        damageReductionTurns: 0,
        visionBonus: 0,
        artifactFlags: createArtifactFlags(),
        artifactKillManaAvailable: true,
        windFeatherCooldown: 0,
        bastionShardCooldown: 0,
        relicFirstDamageReductionAvailable: false,
        relicContactSlowEnemyIds: new Set(),
        relicReflectAvailable: false,
        glassMemoryChain: [],
        glassMemoryDiscountAvailable: false,
        spellsCastThisFloor: 0,
        lastSpellElement: null,
        nextSpellDamageBonus: 0,
        damageMarkBonus: 0,
        damageMarkSource: "",
        curses: [],
        artifacts: [],
        traitId: null,
      };
    }

    function newGame() {
      state.floor = 1;
      state.turn = 0;
      state.logs = [];
      state.enemies = [];
      state.objects = [];
      state.hazards = [];
      state.barriers = [];
      state.effects = [];
      state.visible = [];
      state.explored = [];
      state.selectedSpellIndex = 0;
      state.upgradeMode = false;
      state.evolutionChoiceSpellId = null;
      state.evolutionChoiceSlotIndex = null;
      state.pendingManaRefund = 0;
      state.currentSpellDamageBonus = 0;
      state.pendingBossRelicChoices = [];
      state.pendingBossRelicExit = null;
      state.pendingBossRelicFloor = null;
      state.pendingEvent = null;
      state.pendingSecretRewardChoices = [];
      state.pendingSecretAltarId = null;
      state.secretRoomDiscovered = false;
      state.secretRoomOpened = false;
      state.secretRewardClaimed = false;
      state.secretEntranceId = null;
      state.activeChallenge = null;
      state.idCounter = 1;
      state.lastMoveDir = { x: 1, y: 0 };
      state.player = createPlayer();

      const trait = sample(TRAITS);
      state.player.traitId = trait.id;
      effectBehaviors.applyEffects(effectContext, state.player, trait.onAcquire);

      addLog("Вы вошли в Башню последнего мага.");
      addLog(`Ваш трейт: ${trait.name}.`);
      startFloor(1);
      setMode(MODES.PLAYING);
    }

    function startFloor(floor) {
      state.floor = floor;
      state.enemies = [];
      state.objects = [];
      state.hazards = [];
      state.barriers = [];
      state.effects = [];
      state.pendingEvent = null;
      state.pendingSecretRewardChoices = [];
      state.pendingSecretAltarId = null;
      state.secretRoomDiscovered = false;
      state.secretRoomOpened = false;
      state.secretRewardClaimed = false;
      state.secretEntranceId = null;
      state.activeChallenge = null;
      const floorData = generateFloor(floor);
      state.map = floorData.map;
      state.rooms = floorData.rooms;
      state.visible = createFlagMap(false);
      state.explored = createFlagMap(false);
      state.player.x = floorData.start.x;
      state.player.y = floorData.start.y;
      state.player.floorBlockAvailable = state.player.blocksFirstHit;
      state.player.freeSpellAvailable = state.player.freeFirstSpell;
      state.player.spellsCastThisFloor = 0;
      state.player.floorSpellDamageBonus = 0;
      state.player.damageMarkBonus = 0;
      state.player.damageMarkSource = "";
      state.player.artifactKillManaAvailable = true;
      refreshArtifactFlags();
      state.player.relicFirstDamageReductionAvailable = artifactFlags().firstDamageReduction > 0;
      state.player.relicContactSlowEnemyIds = new Set();
      state.player.relicReflectAvailable = artifactFlags().firstDamageReflect > 0;
      state.player.mana = Math.min(state.player.maxMana, state.player.mana + REWARD_RULES.floorManaRestore);
      placeFloorContent(floorData);
      updateVision();
      checkSecretEntranceProximity();
      const floorStartShield = artifactFlags().floorStartShield;
      if (floorStartShield > 0) {
        state.player.shield += floorStartShield;
        addLog(`Артефакты дают ${floorStartShield} щита при входе на этаж.`);
      }
      if (floor === 1) {
        addLog("Первый этаж башни складывается из камня и тени.");
      } else {
        const bossType = BOSSES_BY_FLOOR[floor];
        addLog(bossType ? `${ENEMY_TYPES[bossType].name} пробуждается.` : `Вы поднимаетесь на этаж ${floor}.`);
      }
      grantFloorMagicShardReward(floor);
      updateUI();
    }

    const localApi = {
      randomInt,
      sample,
      sampleWeighted,
      cssClassToken,
      clamp,
      distance,
      nextId,
      changeMaxHp,
      changeMaxMana,
      spellCost,
      spellLevel,
      nextSpellUpgrade,
      evolutionOptions,
      evolutionById,
      spellEvolution,
      hasEvolution,
      playerSpellEvolution,
      hasElementSpell,
      hasElementEvolution,
      createArtifactFlags,
      activeOwnedArtifacts,
      ownedArtifactById,
      refreshArtifactFlags,
      artifactFlags,
      spellUpgradeDiscount,
      discountedShardCost,
      consumeSpellUpgradeDiscount,
      upgradeCost,
      currentEvolutionCost,
      canEvolveSpell,
      spellUpgradeTotal,
      spellUpgradeOverride,
      grantMagicShardReward,
      grantFloorMagicShardReward,
      grantBossMagicShardReward,
      createFlagMap,
      artifactById,
      getActForFloor,
      getFloorRules,
      getEnemyPoolForFloor,
      getArtifactPoolConfigForFloor,
      chooseArtifactTier,
      getArtifactPoolForFloor,
      chooseArtifact,
      chooseEventArtifact,
      grantArtifactReward,
      addWeakCurse,
      removeWeakCurse,
      chooseChallengeReward,
      describeChallengeReward,
      chooseBossRelicOptions,
      spawnBossStairs,
      clearBossExitCell,
      openBossRelicChoice,
      addLog,
      setMode,
      createPlayer,
      newGame,
      startFloor,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerSystem("core", installCore);
})(globalThis);
