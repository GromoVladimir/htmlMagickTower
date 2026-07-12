// Event rooms, secret rewards, curses, and challenge encounters.
(function registerEventssystem(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerSystem !== "function") {
    throw new Error("MagicTower.registerSystem must load before js/systems/events.js");
  }

  MagicTower.registerBehavior("events", Object.freeze({
    mirrorLibrary: (context, event, params) =>
      context.api.applyMirrorLibraryChoice(event, params.choiceId),
    cursedAltar: (context, event, params) =>
      context.api.applyCursedAltarChoice(event, params.choiceId),
    manaFountain: (context, event, params) =>
      context.api.applyManaFountainChoice(event, params.choiceId),
    trialRoom: (context, event, params) =>
      context.api.applyTrialRoomChoice(event, params.choiceId),
  }));

  MagicTower.registerBehavior("secretRewards", Object.freeze({
    forgottenArchmageKey: (context, choice) => context.api.grantForgottenArchmageKeyReward(choice),
    pureMagicShard: (context, choice) => context.api.grantPureMagicShardReward(choice),
    masteryRune: (context, choice) => context.api.grantMasteryRuneReward(choice),
    lifeSpring: (context, choice) => context.api.grantLifeSpringReward(choice),
    cleansingSeal: (context, choice) => context.api.grantCleansingSealReward(choice),
    secretArtifact: (context, choice) => context.api.grantSecretArtifactReward(choice),
  }));

  /**
   * Installs the events API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installEvents(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("events requires a GameContext with an api object.");
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
      ENEMY_TYPES,
      REWARD_RULES,
      EVENT_ROOM_DEFINITIONS,
      SECRET_REWARD_DEFINITIONS,
    } = data;

    function randomInt(...args) {
      const implementation = context.api.randomInt;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function randomInt is not installed.");
      }
      return implementation(...args);
    }

    function sample(...args) {
      const implementation = context.api.sample;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function sample is not installed.");
      }
      return implementation(...args);
    }

    function distance(...args) {
      const implementation = context.api.distance;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function distance is not installed.");
      }
      return implementation(...args);
    }

    function nextId(...args) {
      const implementation = context.api.nextId;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function nextId is not installed.");
      }
      return implementation(...args);
    }

    function changeMaxHp(...args) {
      const implementation = context.api.changeMaxHp;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function changeMaxHp is not installed.");
      }
      return implementation(...args);
    }

    function changeMaxMana(...args) {
      const implementation = context.api.changeMaxMana;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function changeMaxMana is not installed.");
      }
      return implementation(...args);
    }

    function spellLevel(...args) {
      const implementation = context.api.spellLevel;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function spellLevel is not installed.");
      }
      return implementation(...args);
    }

    function nextSpellUpgrade(...args) {
      const implementation = context.api.nextSpellUpgrade;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function nextSpellUpgrade is not installed.");
      }
      return implementation(...args);
    }

    function refreshArtifactFlags(...args) {
      const implementation = context.api.refreshArtifactFlags;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function refreshArtifactFlags is not installed.");
      }
      return implementation(...args);
    }

    function artifactById(...args) {
      const implementation = context.api.artifactById;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function artifactById is not installed.");
      }
      return implementation(...args);
    }

    function getEnemyPoolForFloor(...args) {
      const implementation = context.api.getEnemyPoolForFloor;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function getEnemyPoolForFloor is not installed.");
      }
      return implementation(...args);
    }

    function chooseEventArtifact(...args) {
      const implementation = context.api.chooseEventArtifact;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function chooseEventArtifact is not installed.");
      }
      return implementation(...args);
    }

    function grantArtifactReward(...args) {
      const implementation = context.api.grantArtifactReward;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function grantArtifactReward is not installed.");
      }
      return implementation(...args);
    }

    function addWeakCurse(...args) {
      const implementation = context.api.addWeakCurse;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function addWeakCurse is not installed.");
      }
      return implementation(...args);
    }

    function removeWeakCurse(...args) {
      const implementation = context.api.removeWeakCurse;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function removeWeakCurse is not installed.");
      }
      return implementation(...args);
    }

    function chooseChallengeReward(...args) {
      const implementation = context.api.chooseChallengeReward;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function chooseChallengeReward is not installed.");
      }
      return implementation(...args);
    }

    function describeChallengeReward(...args) {
      const implementation = context.api.describeChallengeReward;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function describeChallengeReward is not installed.");
      }
      return implementation(...args);
    }

    function addLog(...args) {
      const implementation = context.api.addLog;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function addLog is not installed.");
      }
      return implementation(...args);
    }

    function setMode(...args) {
      const implementation = context.api.setMode;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function setMode is not installed.");
      }
      return implementation(...args);
    }

    function createEnemy(...args) {
      const implementation = context.api.createEnemy;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function createEnemy is not installed.");
      }
      return implementation(...args);
    }

    function roomAt(...args) {
      const implementation = context.api.roomAt;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function roomAt is not installed.");
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

    function isFreeCell(...args) {
      const implementation = context.api.isFreeCell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function isFreeCell is not installed.");
      }
      return implementation(...args);
    }

    function wouldLeavePlayerEscape(...args) {
      const implementation = context.api.wouldLeavePlayerEscape;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function wouldLeavePlayerEscape is not installed.");
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

    function advanceTurn(...args) {
      const implementation = context.api.advanceTurn;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function advanceTurn is not installed.");
      }
      return implementation(...args);
    }

    function addEffect(...args) {
      const implementation = context.api.addEffect;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function addEffect is not installed.");
      }
      return implementation(...args);
    }

    function eventDefinition(event) {
      return EVENT_ROOM_DEFINITIONS[event?.eventId] || null;
    }

    function canSpendHealth(amount) {
      return state.player && state.player.hp > amount;
    }

    function spendHealth(amount, reason) {
      state.player.hp = Math.max(1, state.player.hp - amount);
      addEffect(state.player.x, state.player.y, "#ff4d5a", 8, `-${amount}`);
      addLog(`${reason}: потеряно ${amount} здоровья.`);
    }

    function availableReplacementSpells() {
      return REWARD_RULES.bookSpellPool.filter((spellId) =>
        SPELLS[spellId] && !state.player.spells.includes(spellId)
      );
    }

    function eventChoices(event) {
      const eventId = event?.eventId;
      const currentSpellId = state.player.spells[state.selectedSpellIndex] || state.player.spells[0];
      const currentSpellName = currentSpellId ? SPELLS[currentSpellId].name : "выбранное заклинание";
      const hasReplacement = availableReplacementSpells().length > 0 && Boolean(currentSpellId);
      const hasCurse = Boolean(state.player.curses?.length);
      const trialReward = event?.trialReward || chooseChallengeReward();

      if (eventId === "mirrorLibrary") {
        return [
          {
            id: "mirrorShard",
            title: "Взять осколок",
            effect: "Цена: 2 здоровья. Награда: +1 осколок магии.",
            disabled: !canSpendHealth(2),
            disabledReason: "Нужно больше 2 здоровья.",
          },
          {
            id: "mirrorSwap",
            title: "Сменить заклинание",
            effect: `${currentSpellName} заменится на случайное новое. Уровень и эволюция старого будут потеряны.`,
            disabled: !hasReplacement,
            disabledReason: "Нет доступного нового заклинания для замены.",
          },
          {
            id: "mirrorPower",
            title: "Взять отраженный фокус",
            effect: "Цена: нет. +1 к урону заклинаний до конца текущего этажа.",
          },
        ];
      }

      if (eventId === "cursedAltar") {
        return [
          {
            id: "altarRareCurse",
            title: "Принять дар",
            effect: "Редкий/эпический артефакт текущего акта. Цена: слабое проклятие «Трещина маны».",
          },
          {
            id: "altarHeal",
            title: "Отказаться",
            effect: "Цена: нет. Восстановить 2 здоровья.",
          },
          {
            id: "altarSacrifice",
            title: "Пожертвовать кровь",
            effect: "Цена: 2 здоровья. Награда: случайный артефакт текущего акта.",
            disabled: !canSpendHealth(2),
            disabledReason: "Нужно больше 2 здоровья.",
          },
        ];
      }

      if (eventId === "manaFountain") {
        return [
          {
            id: "fountainMana",
            title: "Напиться маны",
            effect: "Цена: нет. Восстановить всю ману.",
          },
          {
            id: "fountainMaxMana",
            title: "Расширить сосуд",
            effect: "Цена: 2 здоровья. +1 к максимальной мане.",
            disabled: !canSpendHealth(2),
            disabledReason: "Нужно больше 2 здоровья.",
          },
          {
            id: "fountainCleanse",
            title: "Смыть проклятие",
            effect: "Цена: нет. Очистить одно слабое проклятие.",
            disabled: !hasCurse,
            disabledReason: "Нет слабых проклятий.",
          },
        ];
      }

      if (eventId === "trialRoom") {
        return [
          {
            id: "trialStart",
            title: "Начать испытание",
            effect: `Появятся ровно 2 врага не вплотную. Награда: ${describeChallengeReward(trialReward)}.`,
            disabled: getChallengeEnemyPool().length === 0,
            disabledReason: "На этом этаже нет подходящих врагов для испытания.",
          },
          {
            id: "trialDecline",
            title: "Отказаться",
            effect: "Цена: нет. Комната исчезнет без награды.",
          },
        ];
      }

      return [];
    }

    function openEventChoice(event) {
      const definition = eventDefinition(event);
      if (!definition) {
        addLog("Комната-событие молчит.");
        return;
      }
      if (event.used) {
        addLog(`${definition.name} уже исчерпана.`);
        return;
      }

      if (event.eventId === "trialRoom" && !event.trialReward) {
        event.trialReward = chooseChallengeReward();
      }
      state.pendingEvent = event;
      addLog(`Вы находите событие: ${definition.name}.`);
      setMode(MODES.EVENT_CHOICE);
    }

    function cancelEventChoice() {
      state.pendingEvent = null;
      setMode(MODES.PLAYING);
      addLog("Вы оставляете комнату-событие на потом.");
    }

    function chooseEventChoice(index) {
      const event = state.pendingEvent;
      if (!event || state.mode !== MODES.EVENT_CHOICE) {
        return;
      }

      const choices = eventChoices(event);
      const choice = choices[index];
      if (!choice) {
        addLog("Выберите один из доступных вариантов события.");
        return;
      }
      if (choice.disabled) {
        addLog(choice.disabledReason || "Этот вариант сейчас недоступен.");
        return;
      }

      applyEventChoice(event, choice.id);
    }

    function finishEventChoice(event, enemyPhase = true) {
      event.used = true;
      state.objects = state.objects.filter((object) => object.id !== event.id);
      state.pendingEvent = null;
      updateVision();
      setMode(MODES.PLAYING);
      advanceTurn(enemyPhase);
    }

    function applyEventChoice(event, choiceId) {
      const definition = data.getEvent(event?.eventId);
      const handler = definition?.behaviorId
        ? context.behaviors.events[definition.behaviorId]
        : null;
      if (typeof handler !== "function") {
        throw new Error(`Missing event behavior: ${event?.eventId}.`);
      }
      return handler(context, event, { choiceId });
    }

    function completeEventChoice(event, success, enemyPhase = true) {
      if (success) {
        finishEventChoice(event, enemyPhase);
      }
      return success;
    }

    function applyMirrorLibraryChoice(event, choiceId) {
      if (!event || event.used) {
        addLog("Событие уже исчерпано.");
        return false;
      }
      let success = true;
      if (choiceId === "mirrorShard") {
        spendHealth(2, "Зеркальная библиотека отрезает отражение");
        state.player.magicShards += 1;
        addLog("Вы получаете +1 осколок магии.");
      } else if (choiceId === "mirrorSwap") {
        success = replaceSelectedSpellWithRandom();
      } else if (choiceId === "mirrorPower") {
        state.player.floorSpellDamageBonus += 1;
        addLog("Отраженный фокус дает +1 к урону заклинаний до конца этажа.");
      } else {
        success = false;
        addLog("Башня не понимает этот выбор.");
      }
      return completeEventChoice(event, success);
    }

    function applyCursedAltarChoice(event, choiceId) {
      if (!event || event.used) {
        addLog("Событие уже исчерпано.");
        return false;
      }
      let success = true;
      if (choiceId === "altarRareCurse") {
        grantArtifactReward(
          chooseEventArtifact({ cursed: false, rarities: ["rare", "epic"] }),
          "Проклятый алтарь дарит артефакт"
        );
        addWeakCurse("manaCrack");
      } else if (choiceId === "altarHeal") {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
        addLog("Вы отказываетесь от дара алтаря и восстанавливаете 2 здоровья.");
      } else if (choiceId === "altarSacrifice") {
        spendHealth(2, "Проклятый алтарь принимает жертву");
        grantArtifactReward(
          chooseEventArtifact({ cursed: false }),
          "Проклятый алтарь отдает артефакт"
        );
      } else {
        success = false;
        addLog("Башня не понимает этот выбор.");
      }
      return completeEventChoice(event, success);
    }

    function applyManaFountainChoice(event, choiceId) {
      if (!event || event.used) {
        addLog("Событие уже исчерпано.");
        return false;
      }
      let success = true;
      if (choiceId === "fountainMana") {
        state.player.mana = state.player.maxMana;
        addLog("Фонтан маны полностью восстанавливает ману.");
      } else if (choiceId === "fountainMaxMana") {
        spendHealth(2, "Фонтан маны расширяет сосуд силой боли");
        changeMaxMana(state.player, 1);
        addLog("Максимальная мана увеличена на 1.");
      } else if (choiceId === "fountainCleanse") {
        success = removeWeakCurse();
      } else {
        success = false;
        addLog("Башня не понимает этот выбор.");
      }
      return completeEventChoice(event, success);
    }

    function applyTrialRoomChoice(event, choiceId) {
      if (!event || event.used) {
        addLog("Событие уже исчерпано.");
        return false;
      }
      let success = true;
      let enemyPhase = true;
      if (choiceId === "trialStart") {
        success = startTrialEvent(event);
        enemyPhase = false;
      } else if (choiceId === "trialDecline") {
        addLog("Вы отказываетесь от испытания. Комната затихает.");
      } else {
        success = false;
        addLog("Башня не понимает этот выбор.");
      }
      return completeEventChoice(event, success, enemyPhase);
    }

    function spellCanBeUpgraded(spellId) {
      return Boolean(spellId && spellLevel(spellId) < MAX_SPELL_LEVEL && nextSpellUpgrade(spellId));
    }

    function upgradeableSpellForMasteryRune() {
      const selectedSpellId = state.player.spells[state.selectedSpellIndex];
      if (spellCanBeUpgraded(selectedSpellId)) {
        return selectedSpellId;
      }
      return state.player.spells.find((spellId) => spellCanBeUpgraded(spellId)) || null;
    }

    function secretRewardAvailable(reward) {
      if (reward.id === "masteryRune") {
        return Boolean(upgradeableSpellForMasteryRune());
      }
      return true;
    }

    function secretRewardOptions() {
      const keyReward = SECRET_REWARD_DEFINITIONS.find((reward) => reward.id === "forgottenArchmageKey");
      const pool = SECRET_REWARD_DEFINITIONS.filter((reward) =>
        reward.id !== "forgottenArchmageKey" &&
        secretRewardAvailable(reward)
      );
      const choices = keyReward ? [keyReward.id] : [];
      while (pool.length && choices.length < 3) {
        choices.push(pool.splice(randomInt(0, pool.length - 1), 1)[0].id);
      }
      return choices;
    }

    function openSecretRewardChoice(altar) {
      if (state.secretRewardClaimed || altar.used) {
        addLog("Забытый алтарь архимага уже отдал свою силу.");
        return;
      }

      state.pendingSecretRewardChoices = secretRewardOptions();
      state.pendingSecretAltarId = altar.id;
      addLog("Забытый алтарь архимага раскрывает три редкие награды. Выберите одну.");
      setMode(MODES.SECRET_REWARD_CHOICE);
    }

    function cancelSecretRewardChoice() {
      state.pendingSecretRewardChoices = [];
      state.pendingSecretAltarId = null;
      setMode(MODES.PLAYING);
      addLog("Вы оставляете забытый алтарь на потом.");
    }

    function grantMasteryRuneUpgrade() {
      const spellId = upgradeableSpellForMasteryRune();
      if (!spellId) {
        addLog("Руна мастерства не нашла заклинание, которое можно улучшить.");
        return false;
      }

      const spell = SPELLS[spellId];
      const level = spellLevel(spellId);
      const upgrade = nextSpellUpgrade(spellId);
      state.player.spellLevels[spellId] = level + 1;
      refreshArtifactFlags();
      addLog(`Руна мастерства бесплатно усиливает ${spell.name} до уровня ${level + 1}: ${upgrade.text}.`);
      return true;
    }

    function applySecretReward(choice) {
      if (!choice) {
        return false;
      }
      const handler = context.behaviors.secretRewards[choice.behaviorId || choice.id];
      if (typeof handler !== "function") {
        throw new Error(`Missing secret reward behavior: ${choice.behaviorId || choice.id}.`);
      }
      return handler(context, choice, {});
    }

    function grantForgottenArchmageKeyReward() {
      const key = artifactById("forgottenArchmageKey");
      addArtifactToPlayer(key);
      addLog(`${key.name}: +1 осколок магии, полная мана и скидка на следующее улучшение или эволюцию.`);
      return true;
    }

    function grantPureMagicShardReward() {
      state.player.magicShards += 1;
      addLog("Осколок чистой магии: +1 осколок магии.");
      return true;
    }

    function grantMasteryRuneReward() {
      return grantMasteryRuneUpgrade();
    }

    function grantLifeSpringReward() {
      changeMaxHp(state.player, 1);
      state.player.hp = state.player.maxHp;
      state.player.mana = state.player.maxMana;
      addLog("Источник жизни полностью восстанавливает здоровье и ману. Максимальное здоровье увеличено на 1.");
      return true;
    }

    function grantCleansingSealReward() {
      if (state.player.curses?.length) {
        return removeWeakCurse("Печать очищения снимает проклятие");
      }
      changeMaxMana(state.player, 1);
      addLog("Печать очищения не находит проклятий и расширяет сосуд маны на 1.");
      return true;
    }

    function grantSecretArtifactReward() {
      const artifact = chooseEventArtifact({ cursed: false, rarities: ["epic", "legendary"] }) ||
        chooseEventArtifact({ cursed: false });
      return grantArtifactReward(artifact, "Тайный артефакт");
    }

    function chooseSecretReward(index) {
      const choiceId = state.pendingSecretRewardChoices[index];
      const choice = data.getSecretReward(choiceId);
      if (!choice || state.mode !== MODES.SECRET_REWARD_CHOICE) {
        return;
      }

      const altar = state.objects.find((object) => object.id === state.pendingSecretAltarId);
      if (!altar || altar.used || state.secretRewardClaimed) {
        addLog("Сила тайного алтаря уже исчерпана.");
        state.pendingSecretRewardChoices = [];
        state.pendingSecretAltarId = null;
        setMode(MODES.PLAYING);
        return;
      }

      if (!applySecretReward(choice)) {
        addLog("Алтарь не смог исполнить этот выбор.");
        return;
      }

      altar.used = true;
      state.secretRewardClaimed = true;
      state.pendingSecretRewardChoices = [];
      state.pendingSecretAltarId = null;
      addLog(`Секретная награда выбрана: ${choice.title}.`);
      setMode(MODES.PLAYING);
      advanceTurn();
    }

    function replaceSelectedSpellWithRandom() {
      const slotIndex = state.player.spells[state.selectedSpellIndex] ? state.selectedSpellIndex : 0;
      const oldSpellId = state.player.spells[slotIndex];
      const replacementPool = availableReplacementSpells();
      if (!oldSpellId || !replacementPool.length) {
        addLog("Зеркальная библиотека не нашла нового заклинания для замены.");
        return false;
      }

      const newSpellId = sample(replacementPool);
      state.player.spells[slotIndex] = newSpellId;
      delete state.player.spellLevels[oldSpellId];
      delete state.player.spellEvolutions[oldSpellId];
      state.player.spellLevels[newSpellId] = SPELLS[newSpellId].level;
      delete state.player.spellEvolutions[newSpellId];
      state.selectedSpellIndex = slotIndex;
      refreshArtifactFlags();
      addLog(`Зеркальная библиотека меняет ${SPELLS[oldSpellId].name} на ${SPELLS[newSpellId].name}.`);
      return true;
    }

    function getChallengeEnemyPool() {
      return getEnemyPoolForFloor(state.floor).filter((enemyType) => {
        const template = ENEMY_TYPES[enemyType];
        return template && !template.boss && !template.object;
      });
    }

    function challengeSpawnCandidates(event, room = null) {
      const candidates = [];
      const seen = new Set();
      const addCandidate = (x, y) => {
        const key = `${x},${y}`;
        if (seen.has(key)) {
          return;
        }
        const cell = { x, y };
        if (
          isFreeCell(x, y) &&
          distance(cell, state.player) >= 3 &&
          !wouldLeavePlayerEscape(cell)
        ) {
          seen.add(key);
          candidates.push(cell);
        }
      };

      if (room) {
        for (let y = room.y + 1; y < room.y + room.h - 1; y += 1) {
          for (let x = room.x + 1; x < room.x + room.w - 1; x += 1) {
            addCandidate(x, y);
          }
        }
      } else {
        for (let y = 1; y < CONFIG.mapHeight - 1; y += 1) {
          for (let x = 1; x < CONFIG.mapWidth - 1; x += 1) {
            addCandidate(x, y);
          }
        }
      }

      return candidates;
    }

    function findChallengeSpawnCells(event, count) {
      const eventRoom = roomAt(event.x, event.y) || roomAt(state.player.x, state.player.y);
      let candidates = challengeSpawnCandidates(event, eventRoom);
      if (candidates.length < count) {
        candidates = challengeSpawnCandidates(event);
      }

      const chosen = [];
      while (candidates.length && chosen.length < count) {
        chosen.push(candidates.splice(randomInt(0, candidates.length - 1), 1)[0]);
      }
      return chosen;
    }

    function startTrialEvent(event) {
      const enemyPool = getChallengeEnemyPool();
      if (!enemyPool.length) {
        addLog("Комната испытания не нашла подходящих врагов.");
        return false;
      }

      const spawnCells = findChallengeSpawnCells(event, 2);
      if (spawnCells.length < 2) {
        addLog("Комната испытания не нашла две безопасные клетки для врагов.");
        return false;
      }

      const challengeId = nextId();
      const reward = event.trialReward || chooseChallengeReward();
      const enemyIds = spawnCells.slice(0, 2).map((cell) => {
        const enemy = createEnemy(sample(enemyPool), cell.x, cell.y, state.floor, { challengeId });
        state.enemies.push(enemy);
        return enemy.id;
      });

      state.activeChallenge = {
        id: challengeId,
        floor: state.floor,
        enemyIds,
        reward,
        claimed: false,
      };
      addLog(`Испытание началось: появились 2 врага. Награда: ${describeChallengeReward(reward)}.`);
      return true;
    }

    function grantChallengeReward(reward) {
      if (reward.type === "artifact") {
        grantArtifactReward(chooseEventArtifact({ cursed: false }), "Награда испытания");
      } else if (reward.type === "heal") {
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + reward.amount);
        addLog(`Награда испытания: восстановлено ${reward.amount} здоровья.`);
      } else if (reward.type === "shard") {
        state.player.magicShards += 1;
        addLog("Награда испытания: +1 осколок магии.");
      }
    }

    function handleChallengeEnemyDefeat(enemy) {
      const challenge = state.activeChallenge;
      if (
        !challenge ||
        challenge.claimed ||
        challenge.floor !== state.floor ||
        !challenge.enemyIds.includes(enemy.id)
      ) {
        return;
      }

      const hasRemaining = challenge.enemyIds.some((enemyId) =>
        state.enemies.some((item) => item.id === enemyId && item.hp > 0)
      );
      if (hasRemaining) {
        return;
      }

      challenge.claimed = true;
      addLog(`Испытание завершено. Награда: ${describeChallengeReward(challenge.reward)}.`);
      grantChallengeReward(challenge.reward);
      state.activeChallenge = null;
    }

    const localApi = {
      eventDefinition,
      canSpendHealth,
      spendHealth,
      availableReplacementSpells,
      eventChoices,
      openEventChoice,
      cancelEventChoice,
      chooseEventChoice,
      finishEventChoice,
      applyEventChoice,
      applyMirrorLibraryChoice,
      applyCursedAltarChoice,
      applyManaFountainChoice,
      applyTrialRoomChoice,
      spellCanBeUpgraded,
      upgradeableSpellForMasteryRune,
      secretRewardAvailable,
      secretRewardOptions,
      openSecretRewardChoice,
      cancelSecretRewardChoice,
      grantMasteryRuneUpgrade,
      applySecretReward,
      grantForgottenArchmageKeyReward,
      grantPureMagicShardReward,
      grantMasteryRuneReward,
      grantLifeSpringReward,
      grantCleansingSealReward,
      grantSecretArtifactReward,
      chooseSecretReward,
      replaceSelectedSpellWithRandom,
      getChallengeEnemyPool,
      challengeSpawnCandidates,
      findChallengeSpawnCells,
      startTrialEvent,
      grantChallengeReward,
      handleChallengeEnemyDefeat,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerSystem("events", installEvents);
})(globalThis);
