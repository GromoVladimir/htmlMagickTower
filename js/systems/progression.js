// Player commands, spell progression, artifacts, books, and interactions.
(function registerProgressionsystem(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerSystem !== "function") {
    throw new Error("MagicTower.registerSystem must load before js/systems/progression.js");
  }

  /**
   * Installs the progression API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installProgression(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("progression requires a GameContext with an api object.");
    }
    const state = context.state;
    const dom = context.dom;
    const canvasContext = context.canvasContext;
    const data = context.data;
    const ctx = canvasContext;
    const effectBehaviors = context.behaviors && context.behaviors.effects;
    const effectContext = context.effectContext || context;
    const {
      MODES,
      SPELLS,
      MAX_SPELL_LEVEL,
      EVOLUTION_COST,
      REWARD_RULES,
      EVENT_TYPES,
    } = data;

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

    function evolutionOptions(...args) {
      const implementation = context.api.evolutionOptions;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function evolutionOptions is not installed.");
      }
      return implementation(...args);
    }

    function spellEvolution(...args) {
      const implementation = context.api.spellEvolution;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function spellEvolution is not installed.");
      }
      return implementation(...args);
    }

    function hasEvolution(...args) {
      const implementation = context.api.hasEvolution;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function hasEvolution is not installed.");
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

    function consumeSpellUpgradeDiscount(...args) {
      const implementation = context.api.consumeSpellUpgradeDiscount;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function consumeSpellUpgradeDiscount is not installed.");
      }
      return implementation(...args);
    }

    function upgradeCost(...args) {
      const implementation = context.api.upgradeCost;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function upgradeCost is not installed.");
      }
      return implementation(...args);
    }

    function currentEvolutionCost(...args) {
      const implementation = context.api.currentEvolutionCost;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function currentEvolutionCost is not installed.");
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

    function spawnBossStairs(...args) {
      const implementation = context.api.spawnBossStairs;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function spawnBossStairs is not installed.");
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

    function startFloor(...args) {
      const implementation = context.api.startFloor;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function startFloor is not installed.");
      }
      return implementation(...args);
    }

    function isWalkable(...args) {
      const implementation = context.api.isWalkable;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function isWalkable is not installed.");
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

    function objectAt(...args) {
      const implementation = context.api.objectAt;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function objectAt is not installed.");
      }
      return implementation(...args);
    }

    function openSecretEntrance(...args) {
      const implementation = context.api.openSecretEntrance;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function openSecretEntrance is not installed.");
      }
      return implementation(...args);
    }

    function enemyAt(...args) {
      const implementation = context.api.enemyAt;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function enemyAt is not installed.");
      }
      return implementation(...args);
    }

    function barrierAt(...args) {
      const implementation = context.api.barrierAt;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function barrierAt is not installed.");
      }
      return implementation(...args);
    }

    function openEventChoice(...args) {
      const implementation = context.api.openEventChoice;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function openEventChoice is not installed.");
      }
      return implementation(...args);
    }

    function openSecretRewardChoice(...args) {
      const implementation = context.api.openSecretRewardChoice;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function openSecretRewardChoice is not installed.");
      }
      return implementation(...args);
    }

    function damageEnemy(...args) {
      const implementation = context.api.damageEnemy;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function damageEnemy is not installed.");
      }
      return implementation(...args);
    }

    function damagePlayer(...args) {
      const implementation = context.api.damagePlayer;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function damagePlayer is not installed.");
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

    function getAdjacentCells(...args) {
      const implementation = context.api.getAdjacentCells;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function getAdjacentCells is not installed.");
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

    function toggleUpgradeMode() {
      state.upgradeMode = !state.upgradeMode;
      clearEvolutionChoice();
      addLog(state.upgradeMode
        ? "Режим улучшений: нажмите 1-3, чтобы усилить или эволюционировать заклинание."
        : "Режим улучшений закрыт.");
    }

    function clearEvolutionChoice() {
      state.evolutionChoiceSpellId = null;
      state.evolutionChoiceSlotIndex = null;
    }

    function upgradeSpellInSlot(index) {
      const spellId = state.player.spells[index];
      if (!spellId) {
        addLog("В этом слоте нет заклинания для улучшения.");
        return;
      }

      const spell = SPELLS[spellId];
      const level = spellLevel(spellId);
      if (level >= MAX_SPELL_LEVEL) {
        openEvolutionChoice(index, spellId);
        return;
      }

      const upgrade = nextSpellUpgrade(spellId);
      if (!upgrade) {
        addLog(`${spell.name} пока нельзя улучшить дальше.`);
        return;
      }

      const cost = upgradeCost(upgrade);
      if (state.player.magicShards < cost) {
        addLog(`Не хватает осколков магии: нужно ${cost}.`);
        return;
      }

      state.player.magicShards -= cost;
      consumeSpellUpgradeDiscount(upgrade.cost);
      state.player.spellLevels[spellId] = level + 1;
      clearEvolutionChoice();
      addLog(`${spell.name} усилено до уровня ${level + 1}: ${upgrade.text}.`);
    }

    function openEvolutionChoice(index, spellId) {
      const spell = SPELLS[spellId];
      const level = spellLevel(spellId);
      const options = evolutionOptions(spellId);
      const currentEvolution = spellEvolution(spellId);

      if (level < MAX_SPELL_LEVEL) {
        addLog(`${spell.name} сначала нужно усилить до 3 уровня.`);
        return;
      }

      if (currentEvolution) {
        addLog(`${spell.name} уже эволюционировало: ${currentEvolution.name}.`);
        clearEvolutionChoice();
        return;
      }

      if (!options.length) {
        addLog(`${spell.name} пока не имеет веток эволюции.`);
        clearEvolutionChoice();
        return;
      }

      const cost = currentEvolutionCost();
      if (state.player.magicShards < cost) {
        addLog(`Не хватает осколков магии для эволюции: нужно ${cost}.`);
        clearEvolutionChoice();
        return;
      }

      state.evolutionChoiceSpellId = spellId;
      state.evolutionChoiceSlotIndex = index;
      addLog(`Выберите эволюцию для ${spell.name}: 1 - ${options[0].name}, 2 - ${options[1].name}, 3 - отмена.`);
      updateUI();
    }

    function chooseEvolutionBranch(choiceIndex) {
      const spellId = state.evolutionChoiceSpellId;
      if (!spellId) {
        return;
      }

      if (choiceIndex === 2) {
        const spell = SPELLS[spellId];
        clearEvolutionChoice();
        addLog(`Выбор эволюции для ${spell.name} отменен.`);
        return;
      }

      const spell = SPELLS[spellId];
      const branch = evolutionOptions(spellId)[choiceIndex];
      if (!branch) {
        addLog("Выберите ветку 1 или 2.");
        return;
      }

      if (spellLevel(spellId) < MAX_SPELL_LEVEL) {
        clearEvolutionChoice();
        addLog(`${spell.name} сначала нужно усилить до 3 уровня.`);
        return;
      }

      if (hasEvolution(spellId)) {
        const currentEvolution = spellEvolution(spellId);
        clearEvolutionChoice();
        addLog(`${spell.name} уже эволюционировало: ${currentEvolution.name}.`);
        return;
      }

      const cost = currentEvolutionCost();
      if (state.player.magicShards < cost) {
        clearEvolutionChoice();
        addLog(`Не хватает осколков магии для эволюции: нужно ${cost}.`);
        return;
      }

      state.player.magicShards -= cost;
      consumeSpellUpgradeDiscount(EVOLUTION_COST);
      state.player.spellEvolutions[spellId] = branch.id;
      refreshArtifactFlags();
      clearEvolutionChoice();
      addLog(`${spell.name} эволюционирует: ${branch.name}. ${branch.logText}`);
      updateUI();
    }

    function tryMovePlayer(dx, dy) {
      const target = { x: state.player.x + dx, y: state.player.y + dy };
      state.lastMoveDir = { x: dx, y: dy };
      if (!isWalkable(target.x, target.y)) {
        addLog("Каменная стена не поддается.");
        return;
      }
      if (barrierAt(target.x, target.y)) {
        addLog("Земная преграда держит проход.");
        return;
      }

      const enemy = enemyAt(target.x, target.y);
      if (enemy) {
        damageEnemy(enemy, state.player.staffDamage, "посох");
        advanceTurn();
        return;
      }

      state.player.x = target.x;
      state.player.y = target.y;
      const trap = objectAt(target.x, target.y, [EVENT_TYPES.TRAP]);
      if (trap && trap.armed) {
        trap.armed = false;
        damagePlayer(2, "Ловушка вспыхивает под ногами.");
      }
      advanceTurn();
    }

    function interact() {
      const here = objectAt(state.player.x, state.player.y);
      const adjacent = getAdjacentCells(state.player.x, state.player.y)
        .map((cell) => objectAt(cell.x, cell.y))
        .find((object) => object && object.type !== EVENT_TYPES.TRAP);
      const target = here && here.type !== EVENT_TYPES.TRAP ? here : adjacent;

      if (!target) {
        const touchesWall = getAdjacentCells(state.player.x, state.player.y)
          .some((cell) => !isWalkable(cell.x, cell.y));
        addLog(touchesWall ? "Здесь только холодный камень." : "Здесь не с чем взаимодействовать.");
        return;
      }

      if (target.type === EVENT_TYPES.STAIRS) {
        startFloor(state.floor + 1);
        advanceTurn(false);
        return;
      }

      if (target.type === EVENT_TYPES.BOOK) {
        learnBook(target);
        advanceTurn();
        return;
      }

      if (target.type === EVENT_TYPES.ARTIFACT) {
        collectArtifact(target);
        advanceTurn();
        return;
      }

      if (target.type === EVENT_TYPES.EVENT_ROOM) {
        openEventChoice(target);
        return;
      }

      if (target.type === EVENT_TYPES.SECRET_ENTRANCE) {
        if (openSecretEntrance(target)) {
          advanceTurn();
        }
        return;
      }

      if (target.type === EVENT_TYPES.SECRET_ALTAR) {
        openSecretRewardChoice(target);
        return;
      }

      if (target.type === EVENT_TYPES.CHEST) {
        if (target.used) {
          addLog("Сундук уже пуст.");
          return;
        }
        target.used = true;
        state.player.mana = Math.min(state.player.maxMana, state.player.mana + REWARD_RULES.chestMana);
        addLog("В сундуке мерцает кристалл: +3 маны.");
        advanceTurn();
        return;
      }

      if (target.type === EVENT_TYPES.ALTAR) {
        if (target.used) {
          addLog("Алтарь уже погас.");
          return;
        }
        target.used = true;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + REWARD_RULES.altarHeal);
        addLog("Алтарь восстанавливает 3 здоровья.");
        advanceTurn();
        return;
      }

      addLog("Объект молчит.");
    }

    function applyArtifact(artifact, player = state.player) {
      effectBehaviors.applyEffects(effectContext, player, artifact?.onAcquire || []);
    }

    function addArtifactToPlayer(artifact) {
      applyArtifact(artifact);
      state.player.artifacts.push({
        definitionId: artifact.id,
        active: true,
        spent: false,
      });
      refreshArtifactFlags();
    }

    function chooseBossRelic(index) {
      const relicId = state.pendingBossRelicChoices[index];
      const relic = artifactById(relicId);
      if (!relic || state.mode !== MODES.RELIC_CHOICE) {
        return;
      }

      addArtifactToPlayer(relic);
      addLog(`Босс-реликвия выбрана: ${relic.name}. ${relic.bonusText}`);

      const exit = state.pendingBossRelicExit;
      state.pendingBossRelicChoices = [];
      state.pendingBossRelicExit = null;
      state.pendingBossRelicFloor = null;

      if (exit) {
        spawnBossStairs(exit);
      }
      setMode(MODES.PLAYING);
    }

    function collectArtifact(object) {
      const artifact = artifactById(object.artifactId);
      if (!artifact) {
        addLog("Артефакт рассыпается, не оставив следа.");
        state.objects = state.objects.filter((item) => item.id !== object.id);
        return;
      }

      addArtifactToPlayer(artifact);
      state.objects = state.objects.filter((item) => item.id !== object.id);
      addLog(`${artifact.cursed ? "Проклятый артефакт" : "Артефакт"}: ${artifact.name}. ${artifact.bonusText}`);
      if (artifact.cursed) {
        addLog(`Проклятие раскрыто: ${artifact.curseText}`);
      }
      updateVision();
    }

    function learnBook(book) {
      const spell = SPELLS[book.spellId];
      addLog(`Найдена книга: ${spell.name}.`);
      if (state.player.spells.includes(book.spellId)) {
        addLog("Вы уже знаете это заклинание.");
      } else if (state.player.spells.length >= REWARD_RULES.maxKnownSpells) {
        addLog("Можно держать только 3 активных заклинания.");
      } else {
        state.player.spells.push(book.spellId);
        state.player.spellLevels[book.spellId] = SPELLS[book.spellId].level;
        refreshArtifactFlags();
        addLog("Вы изучили новое заклинание.");
      }
      state.objects = state.objects.filter((object) => object.id !== book.id);
    }

    const localApi = {
      toggleUpgradeMode,
      clearEvolutionChoice,
      upgradeSpellInSlot,
      openEvolutionChoice,
      chooseEvolutionBranch,
      tryMovePlayer,
      interact,
      applyArtifact,
      addArtifactToPlayer,
      chooseBossRelic,
      collectArtifact,
      learnBook,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerSystem("progression", installProgression);
})(globalThis);
