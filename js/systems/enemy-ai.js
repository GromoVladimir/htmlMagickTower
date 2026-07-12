// Standard enemy turns, special abilities, attacks, and movement.
(function registerEnemyAisystem(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerSystem !== "function") {
    throw new Error("MagicTower.registerSystem must load before js/systems/enemy-ai.js");
  }

  MagicTower.registerBehavior("enemies", Object.freeze({
    towerCultist: (context, enemy) => context.api.tryCultistMark(enemy),
    astralGuard: (context, enemy) => context.api.tryAstralDash(enemy),
    voidWitch: (context, enemy) => context.api.tryVoidWitchHazard(enemy),
  }));

  /**
   * Installs the enemyAi API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installEnemyAi(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("enemyAi requires a GameContext with an api object.");
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
      ELEMENT_COLORS,
      BOSS_RULES,
    } = data;

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

    function artifactFlags(...args) {
      const implementation = context.api.artifactFlags;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function artifactFlags is not installed.");
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

    function isInside(...args) {
      const implementation = context.api.isInside;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function isInside is not installed.");
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

    function isFreeCell(...args) {
      const implementation = context.api.isFreeCell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function isFreeCell is not installed.");
      }
      return implementation(...args);
    }

    function getActiveSummonsForBoss(...args) {
      const implementation = context.api.getActiveSummonsForBoss;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function getActiveSummonsForBoss is not installed.");
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

    function cellsWithinDistance(...args) {
      const implementation = context.api.cellsWithinDistance;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function cellsWithinDistance is not installed.");
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

    function actBoss(...args) {
      const implementation = context.api.actBoss;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function actBoss is not installed.");
      }
      return implementation(...args);
    }

    function actBossObject(...args) {
      const implementation = context.api.actBossObject;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function actBossObject is not installed.");
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

    function actEnemies() {
      const enemies = [...state.enemies];
      enemies.forEach(handleEnemyTurn);
    }

    function tickEnemyAbilityCooldowns(enemy) {
      if (enemy.markCooldownLeft > 0) {
        enemy.markCooldownLeft -= 1;
      }
      if (enemy.dashCooldownLeft > 0) {
        enemy.dashCooldownLeft -= 1;
      }
      if (enemy.hazardCooldownLeft > 0) {
        enemy.hazardCooldownLeft -= 1;
      }
    }

    function handleEnemyTurn(enemy) {
      if (!state.enemies.includes(enemy) || state.mode !== MODES.PLAYING) {
        return;
      }
      if (enemy.stun > 0) {
        enemy.stun -= 1;
        addEffect(enemy.x, enemy.y, ELEMENT_COLORS.lightning, 5, "!");
        return;
      }
      if (enemy.slow > 0) {
        return;
      }
      enemy.skipCounter = (enemy.skipCounter + 1) % enemy.speed;
      if (enemy.skipCounter !== 0) {
        return;
      }

      tickEnemyAbilityCooldowns(enemy);
      if (enemy.postDashDelayLeft > 0) {
        enemy.postDashDelayLeft -= 1;
        addEffect(enemy.x, enemy.y, ELEMENT_COLORS.arcane, 5, "...");
        return;
      }

      if (enemy.object) {
        actBossObject(enemy);
        return;
      }

      if (enemy.boss) {
        actBoss(enemy);
      }

      if (tryEnemySpecialAction(enemy)) {
        return;
      }

      const dist = distance(enemy, state.player);
      if (dist <= enemy.range && hasLineOfSight(enemy, state.player, enemy.range)) {
        performEnemyAttack(enemy);
        return;
      }
      moveEnemyTowardPlayer(enemy);
    }

    function tryEnemySpecialAction(enemy) {
      const definition = data.getEnemy(enemy.definitionId || enemy.type);
      const handler = definition?.behaviorId
        ? context.behaviors.enemies[definition.behaviorId]
        : null;
      return typeof handler === "function" ? handler(context, enemy, definition) : false;
    }

    function tryCultistMark(enemy) {
      if (
        enemy.markCooldownLeft > 0 ||
        state.player.damageMarkBonus > 0 ||
        distance(enemy, state.player) > enemy.range ||
        !hasLineOfSight(enemy, state.player, enemy.range) ||
        context.rng.next() > enemy.markChance
      ) {
        return false;
      }

      state.player.damageMarkBonus = 1;
      state.player.damageMarkSource = enemy.name;
      enemy.markCooldownLeft = enemy.markCooldown;
      addLog("Культист башни ставит метку: следующий полученный урон увеличится на 1.");
      addEffect(state.player.x, state.player.y, ELEMENT_COLORS.shadow, 8, "метка");
      return true;
    }

    function tryAstralDash(enemy) {
      const dist = distance(enemy, state.player);
      if (
        enemy.dashCooldownLeft > 0 ||
        dist <= 2 ||
        dist > enemy.dashRange ||
        context.rng.next() > enemy.dashChance
      ) {
        return false;
      }

      const candidates = cellsWithinDistance(state.player, 2)
        .filter((cell) =>
          distance(cell, state.player) === 2 &&
          distance(cell, enemy) < dist &&
          isFreeCell(cell.x, cell.y) &&
          !wouldLeavePlayerEscape(cell, enemy)
        )
        .sort((a, b) => distance(a, enemy) - distance(b, enemy));
      if (!candidates.length) {
        return false;
      }

      const spot = sample(candidates.slice(0, Math.min(4, candidates.length)));
      addEffect(enemy.x, enemy.y, ELEMENT_COLORS.arcane, 8, "рыв");
      enemy.x = spot.x;
      enemy.y = spot.y;
      enemy.dashCooldownLeft = enemy.dashCooldown;
      enemy.postDashDelayLeft = enemy.postDashDelay;
      addEffect(enemy.x, enemy.y, ELEMENT_COLORS.arcane, 8, "рыв");
      addLog("Астральный страж делает рывок сквозь пространство и замирает на миг.");
      return true;
    }

    function tryVoidWitchHazard(enemy) {
      if (
        enemy.hazardCooldownLeft > 0 ||
        distance(enemy, state.player) > enemy.range ||
        !hasLineOfSight(enemy, state.player, enemy.range)
      ) {
        return false;
      }

      const activeWitchHazards = state.hazards.filter((hazard) =>
        hazard.type === "danger" &&
        hazard.sourceType === "voidWitch"
      );
      if (activeWitchHazards.length >= enemy.maxSourceHazards) {
        return false;
      }

      const candidates = getAdjacentCells(state.player.x, state.player.y)
        .filter((cell) =>
          isWalkable(cell.x, cell.y) &&
          !barrierAt(cell.x, cell.y) &&
          !enemyAt(cell.x, cell.y) &&
          !state.hazards.some((hazard) =>
            hazard.type === "danger" &&
            hazard.x === cell.x &&
            hazard.y === cell.y
          )
        );
      if (!candidates.length) {
        return false;
      }

      const spot = sample(candidates);
      state.hazards.push({
        id: nextId(),
        type: "danger",
        sourceType: "voidWitch",
        x: spot.x,
        y: spot.y,
        radius: 0,
        turns: enemy.hazardTurns,
        summonerId: enemy.id,
      });
      enemy.hazardCooldownLeft = enemy.hazardCooldown;
      addEffect(spot.x, spot.y, ELEMENT_COLORS.shadow, 8, "пуст");
      addLog("Пустотная ведьма открывает опасную клетку рядом с магом.");
      return true;
    }

    function enemyAttackText(enemy) {
      if (enemy.attackText) {
        return enemy.attackText;
      }
      return enemy.ranged ? `${enemy.name} швыряет проклятую страницу.` : `${enemy.name} атакует.`;
    }

    function performEnemyAttack(enemy) {
      if (enemy.manaBurn > 0 && state.player.mana > 0) {
        const burned = Math.min(enemy.manaBurn, state.player.mana);
        state.player.mana -= burned;
        addLog(`${enemy.name} сжигает ${burned} ману.`);
        addEffect(state.player.x, state.player.y, ELEMENT_COLORS.arcane, 7, `-${burned}м`);
      }
      damagePlayer(enemyAttackDamage(enemy), enemyAttackText(enemy), enemy);
    }

    function enemyAttackDamage(enemy) {
      let amount = enemy.damage + (enemy.nextAttackBonus || 0);
      if (
        enemy.type === "towerAvatar" &&
        getActiveSummonsForBoss(enemy, (summon) => summon.type === "towerShard").length > 0
      ) {
        amount += BOSS_RULES.towerAvatar.shardDamageBonus;
      }
      enemy.nextAttackBonus = 0;
      return amount;
    }

    function applyContactSlowRelic(enemy) {
      const flags = artifactFlags();
      if (
        flags.contactSlowTurns <= 0 ||
        !state.player.relicContactSlowEnemyIds ||
        state.player.relicContactSlowEnemyIds.has(enemy.id) ||
        distance(enemy, state.player) > 1
      ) {
        return;
      }
      state.player.relicContactSlowEnemyIds.add(enemy.id);
      enemy.slow = Math.max(enemy.slow, flags.contactSlowTurns);
      addLog(`Тяжесть древнего камня замедляет ${enemy.name}.`);
      addEffect(enemy.x, enemy.y, ELEMENT_COLORS.earth, 7, "кам");
    }

    function moveEnemyTowardPlayer(enemy) {
      const options = [
        { x: enemy.x + Math.sign(state.player.x - enemy.x), y: enemy.y },
        { x: enemy.x, y: enemy.y + Math.sign(state.player.y - enemy.y) },
        { x: enemy.x - Math.sign(state.player.x - enemy.x), y: enemy.y },
        { x: enemy.x, y: enemy.y - Math.sign(state.player.y - enemy.y) },
      ];
      options.sort((a, b) => distance(a, state.player) - distance(b, state.player));
      const next = options.find((cell) =>
        isWalkable(cell.x, cell.y) &&
        !barrierAt(cell.x, cell.y) &&
        !enemyAt(cell.x, cell.y) &&
        !(state.player.x === cell.x && state.player.y === cell.y) &&
        (!(enemy.summoned || enemy.minion || enemy.illusion) || !wouldLeavePlayerEscape(cell, enemy))
      );
      if (next) {
        enemy.x = next.x;
        enemy.y = next.y;
        applyContactSlowRelic(enemy);
      }
    }

    function hasLineOfSight(from, to, range) {
      if (distance(from, to) > range) {
        return false;
      }
      if (from.x !== to.x && from.y !== to.y) {
        return range === 1;
      }
      const dx = Math.sign(to.x - from.x);
      const dy = Math.sign(to.y - from.y);
      let x = from.x;
      let y = from.y;
      while (x !== to.x || y !== to.y) {
        x += dx;
        y += dy;
        if (x === to.x && y === to.y) {
          return true;
        }
        if (!isWalkable(x, y) || barrierAt(x, y)) {
          return false;
        }
      }
      return true;
    }

    function getAdjacentCells(x, y) {
      return [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ].filter((cell) => isInside(cell.x, cell.y));
    }

    function randomAdjacentFreeCell(x, y) {
      const cells = getAdjacentCells(x, y).filter((cell) => isFreeCell(cell.x, cell.y));
      return cells.length ? sample(cells) : null;
    }

    function pushEnemy(enemy, steps) {
      const actualSteps = Math.max(0, steps - (enemy.knockbackResistance || 0));
      if (actualSteps <= 0) {
        return { moved: false, blocked: false };
      }
      const dx = Math.sign(enemy.x - state.player.x);
      const dy = Math.sign(enemy.y - state.player.y);
      let moved = false;
      for (let i = 0; i < actualSteps; i += 1) {
        const next = { x: enemy.x + dx, y: enemy.y + dy };
        if (!isFreeCell(next.x, next.y)) {
          return { moved, blocked: true };
        }
        enemy.x = next.x;
        enemy.y = next.y;
        moved = true;
      }
      return { moved, blocked: false };
    }

    const localApi = {
      actEnemies,
      tickEnemyAbilityCooldowns,
      handleEnemyTurn,
      tryEnemySpecialAction,
      tryCultistMark,
      tryAstralDash,
      tryVoidWitchHazard,
      enemyAttackText,
      performEnemyAttack,
      enemyAttackDamage,
      applyContactSlowRelic,
      moveEnemyTowardPlayer,
      hasLineOfSight,
      getAdjacentCells,
      randomAdjacentFreeCell,
      pushEnemy,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerSystem("enemyAi", installEnemyAi);
})(globalThis);
