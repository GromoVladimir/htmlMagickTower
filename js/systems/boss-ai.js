// Boss behavior dispatch and the three boss encounter implementations.
(function registerBossAisystem(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerSystem !== "function") {
    throw new Error("MagicTower.registerSystem must load before js/systems/boss-ai.js");
  }

  MagicTower.registerBehavior("bosses", Object.freeze({
    stoneArchgolem: (context, boss) => context.api.actStoneArchgolem(boss),
    mirrorArchmage: (context, boss) => context.api.actMirrorArchmage(boss),
    towerAvatar: (context, boss) => context.api.actTowerAvatar(boss),
  }));

  /**
   * Installs the bossAi API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installBossAi(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("bossAi requires a GameContext with an api object.");
    }
    const state = context.state;
    const dom = context.dom;
    const canvasContext = context.canvasContext;
    const data = context.data;
    const ctx = canvasContext;
    const effectBehaviors = context.behaviors && context.behaviors.effects;
    const effectContext = context.effectContext || context;
    const {
      BOSS_RULES,
    } = data;

    function sample(...args) {
      const implementation = context.api.sample;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function sample is not installed.");
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

    function addLog(...args) {
      const implementation = context.api.addLog;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function addLog is not installed.");
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

    function canBossSummon(...args) {
      const implementation = context.api.canBossSummon;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function canBossSummon is not installed.");
      }
      return implementation(...args);
    }

    function findSafeBossSpawnCell(...args) {
      const implementation = context.api.findSafeBossSpawnCell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function findSafeBossSpawnCell is not installed.");
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

    function actBoss(enemy) {
      const definition = data.getBoss(enemy.definitionId || enemy.type);
      const handler = definition?.behaviorId
        ? context.behaviors.bosses[definition.behaviorId]
        : null;
      if (typeof handler === "function") {
        return handler(context, enemy, definition);
      }
      throw new Error(`Missing boss behavior: ${enemy.definitionId || enemy.type}.`);
    }

    function actStoneArchgolem(boss) {
      const rules = BOSS_RULES.stoneArchgolem;
      boss.bossTimer += 1;
      if (boss.bossTimer % rules.specialEvery !== 0) {
        return;
      }

      const canSummon = canBossSummon(boss, (enemy) => enemy.type === "smallGolem", rules.maxSmallGolems);
      if (canSummon && context.rng.next() < rules.summonChance) {
        const spot = findSafeBossSpawnCell(boss, {
          maxDistance: 3,
          minPlayerDistance: rules.minSummonDistanceFromPlayer,
        });
        if (spot) {
          state.enemies.push(createEnemy("smallGolem", spot.x, spot.y, state.floor, {
            summonerId: boss.id,
            summoned: true,
            minion: true,
          }));
          addLog("Архиголем призывает малого голема.");
          return;
        }
      }

      if (context.rng.next() < 0.6) {
        placeBossDangerCell(boss, rules.runeTurns, "Архиголем выбивает в камне опасную руну.");
      } else {
        boss.nextAttackBonus = Math.max(boss.nextAttackBonus, rules.attackBoost);
        addLog("Архиголем собирает силу для следующего удара.");
      }
    }

    function actMirrorArchmage(boss) {
      const rules = BOSS_RULES.mirrorArchmage;
      boss.bossTimer += 1;
      if (boss.bossTimer % rules.specialEvery !== 0) {
        return;
      }

      if (canBossSummon(boss, (enemy) => enemy.illusion, rules.maxIllusions)) {
        const spot = findSafeBossSpawnCell(boss, {
          maxDistance: 3,
          minPlayerDistance: rules.minSummonDistanceFromPlayer,
        });
        if (spot) {
          state.enemies.push(createEnemy("mirrorIllusion", spot.x, spot.y, state.floor, {
            summonerId: boss.id,
            lifetime: rules.illusionTurns,
          }));
          addLog("Зеркальный архимаг создает хрупкую иллюзию.");
          return;
        }
      }

      boss.nextAttackBonus = Math.max(boss.nextAttackBonus, rules.attackBoost);
      addLog("Зеркальный архимаг складывает свет в усиленный луч.");
    }

    function actTowerAvatar(boss) {
      const rules = BOSS_RULES.towerAvatar;
      boss.bossTimer += 1;
      boss.shardCooldown = Math.max(0, boss.shardCooldown - 1);

      const phase = updateTowerAvatarPhase(boss);
      const actionEvery = phase === 3 ? rules.phase3Every : rules.specialEvery;
      if (phase === 1 || boss.bossTimer % actionEvery !== 0) {
        return;
      }

      if (phase === 2) {
        if (context.rng.next() < 0.35 && tryCreateTowerShard(boss)) {
          return;
        }
        placeBossDangerCell(boss, rules.hazardTurns, "Аватар башни зажигает опасные клетки.");
        return;
      }

      const roll = context.rng.next();
      if (roll < 0.4 && tryCreateTowerShard(boss)) {
        return;
      }
      if (roll < 0.75) {
        placeBossDangerCell(boss, rules.hazardTurns, "Сердце башни меняет узор пола опасными клетками.");
      } else {
        boss.nextAttackBonus = Math.max(boss.nextAttackBonus, rules.attackBoost);
        addLog("Аватар башни усиливает следующую атаку.");
      }
    }

    function actBossObject(enemy) {
      if (enemy.type !== "towerShard") {
        return;
      }
      enemy.bossTimer += 1;
      if (enemy.bossTimer % BOSS_RULES.towerAvatar.shardPulseEvery !== 0) {
        return;
      }
      placeBossDangerCell(enemy, BOSS_RULES.towerAvatar.hazardTurns, "Осколок башни искажает пол опасной клеткой.");
    }

    function updateTowerAvatarPhase(boss) {
      const rules = BOSS_RULES.towerAvatar;
      const hpRatio = boss.hp / boss.maxHp;
      const nextPhase = hpRatio <= rules.phase3Threshold ? 3 : hpRatio <= rules.phase2Threshold ? 2 : 1;
      if (boss.phase !== nextPhase) {
        boss.phase = nextPhase;
        if (nextPhase === 2) {
          addLog("Аватар башни переходит во вторую фазу: пол становится опасным.");
        } else if (nextPhase === 3) {
          addLog("Сердце башни раскрывается: финальная фаза ускоряет атаки.");
        }
      }
      return boss.phase;
    }

    function tryCreateTowerShard(boss) {
      const rules = BOSS_RULES.towerAvatar;
      const canCreate =
        boss.shardCooldown <= 0 &&
        canBossSummon(boss, (enemy) => enemy.type === "towerShard", rules.maxShards);
      if (!canCreate) {
        return false;
      }

      const spot = findSafeBossSpawnCell(boss, {
        maxDistance: 4,
        minPlayerDistance: rules.minShardDistanceFromPlayer,
      });
      if (!spot) {
        return false;
      }

      state.enemies.push(createEnemy("towerShard", spot.x, spot.y, state.floor, {
        hp: rules.shardHp,
        maxHp: rules.shardHp,
        summonerId: boss.id,
        summoned: true,
        object: true,
      }));
      boss.shardCooldown = rules.shardCooldown;
      addLog("Аватар башни создает Осколок башни: пока он цел, атаки сильнее.");
      return true;
    }

    function placeBossDangerCell(source, turns, message) {
      const candidates = getAdjacentCells(state.player.x, state.player.y)
        .filter((cell) => isWalkable(cell.x, cell.y) && !enemyAt(cell.x, cell.y));
      const spot = candidates.length ? sample(candidates) : { x: state.player.x, y: state.player.y };
      state.hazards.push({
        id: nextId(),
        type: "danger",
        x: spot.x,
        y: spot.y,
        radius: 0,
        turns,
        summonerId: source.summonerId || source.id,
      });
      addLog(message);
    }

    const localApi = {
      actBoss,
      actStoneArchgolem,
      actMirrorArchmage,
      actTowerAvatar,
      actBossObject,
      updateTowerAvatarPhase,
      tryCreateTowerShard,
      placeBossDangerCell,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerSystem("bossAi", installBossAi);
})(globalThis);
