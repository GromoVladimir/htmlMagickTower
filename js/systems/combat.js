// Damage pipelines, status ticks, hazards, barriers, and turn advancement.
(function registerCombatsystem(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerSystem !== "function") {
    throw new Error("MagicTower.registerSystem must load before js/systems/combat.js");
  }

  /**
   * Installs the combat API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installCombat(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("combat requires a GameContext with an api object.");
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
      ELEMENT_COLORS,
      ELEMENT_NAMES,
      BOSS_RULES,
    } = data;

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

    function ownedArtifactById(...args) {
      const implementation = context.api.ownedArtifactById;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function ownedArtifactById is not installed.");
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

    function artifactFlags(...args) {
      const implementation = context.api.artifactFlags;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function artifactFlags is not installed.");
      }
      return implementation(...args);
    }

    function grantBossMagicShardReward(...args) {
      const implementation = context.api.grantBossMagicShardReward;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function grantBossMagicShardReward is not installed.");
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

    function clearBossExitCell(...args) {
      const implementation = context.api.clearBossExitCell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function clearBossExitCell is not installed.");
      }
      return implementation(...args);
    }

    function openBossRelicChoice(...args) {
      const implementation = context.api.openBossRelicChoice;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function openBossRelicChoice is not installed.");
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

    function handleChallengeEnemyDefeat(...args) {
      const implementation = context.api.handleChallengeEnemyDefeat;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function handleChallengeEnemyDefeat is not installed.");
      }
      return implementation(...args);
    }

    function hasNegativeStatus(...args) {
      const implementation = context.api.hasNegativeStatus;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function hasNegativeStatus is not installed.");
      }
      return implementation(...args);
    }

    function actEnemies(...args) {
      const implementation = context.api.actEnemies;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function actEnemies is not installed.");
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

    function updateUI(...args) {
      const implementation = context.api.updateUI;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function updateUI is not installed.");
      }
      return implementation(...args);
    }

    function adjustEnemyDamage(enemy, amount, element) {
      const rules = BOSS_RULES.mirrorArchmage;
      if (
        enemy.type === "mirrorArchmage" &&
        element &&
        enemy.resistElement === element &&
        enemy.resistTurns > 0
      ) {
        const reduced = Math.max(rules.minResistedDamage, Math.ceil(amount * (1 - rules.resistReduction)));
        if (reduced < amount) {
          addLog(`Зеркальный архимаг сопротивляется ${ELEMENT_NAMES[element] || "стихии"}.`);
        }
        return reduced;
      }
      return amount;
    }

    function refreshMirrorResistance(enemy, element) {
      if (enemy.type !== "mirrorArchmage" || !element || enemy.hp <= 0) {
        return;
      }
      const shouldLog = enemy.resistElement !== element || enemy.resistTurns <= 0;
      enemy.resistElement = element;
      enemy.resistTurns = BOSS_RULES.mirrorArchmage.resistTurns;
      if (shouldLog) {
        addLog(`Зеркальный архимаг подстроился к ${ELEMENT_NAMES[element] || "стихии"}.`);
      }
    }

    function applyDamageVulnerabilities(enemy, amount) {
      let finalAmount = amount;
      const statusBonus = artifactFlags().statusDamageBonus;
      if (finalAmount > 0 && statusBonus > 0 && hasNegativeStatus(enemy)) {
        finalAmount += statusBonus;
        addLog(`${enemy.name}: Пепельное сердце усиливает удар (+${statusBonus}).`);
      }
      if (finalAmount > 0 && enemy.acidTurns > 0) {
        const bonus = enemy.acidBonus || 1;
        finalAmount += bonus;
        addLog(`${enemy.name}: кислота открывает слабое место (+${bonus}).`);
      }
      if (finalAmount > 0 && enemy.curseMarkTurns > 0 && enemy.curseMarkHits > 0) {
        const bonus = enemy.curseMarkBonus || 2;
        finalAmount += bonus;
        enemy.curseMarkHits -= 1;
        addLog(`${enemy.name}: проклятая метка усиливает удар (+${bonus}).`);
        if (enemy.curseMarkHits <= 0) {
          enemy.curseMarkTurns = 0;
        }
      }
      return finalAmount;
    }

    function handleArtifactEnemyKill(enemy, element) {
      const flags = artifactFlags();
      if (!state.player?.artifactKillManaAvailable || flags.floorKillMana <= 0) {
        return;
      }
      state.player.artifactKillManaAvailable = false;
      let refund = flags.floorKillMana;
      const shadowKill = element === "shadow" && flags.shadowKillManaBonus > 0;
      if (shadowKill) {
        refund += flags.shadowKillManaBonus;
      }
      state.player.mana = Math.min(state.player.maxMana, state.player.mana + refund);
      addLog(`Маска сумрака возвращает ${refund} маны за победу над ${enemy.name}.`);
      if (shadowKill && flags.shadowKillNextSpellDamage > 0) {
        state.player.nextSpellDamageBonus += flags.shadowKillNextSpellDamage;
        addLog(`Маска сумрака усиливает следующее заклинание на ${flags.shadowKillNextSpellDamage} урон.`);
      }
    }

    function removeEnemy(enemy) {
      state.enemies = state.enemies.filter((item) => item.id !== enemy.id);
    }

    function clearBossSummons(boss) {
      state.enemies = state.enemies.filter((enemy) => enemy.summonerId !== boss.id);
      state.hazards = state.hazards.filter((hazard) => hazard.summonerId !== boss.id);
    }

    function damageEnemy(enemy, amount, source, element = null) {
      if (enemy.crystalShieldActive && amount > 0) {
        enemy.crystalShieldActive = false;
        addLog(`Кристальный щит ${enemy.name} принимает удар и раскалывается.`);
        addEffect(enemy.x, enemy.y, ELEMENT_COLORS.ice, 8, "щит");
        return false;
      }
      const resistedAmount = adjustEnemyDamage(enemy, amount, element);
      const finalAmount = applyDamageVulnerabilities(enemy, resistedAmount);
      enemy.hp -= finalAmount;
      addLog(`${enemy.name} получает ${finalAmount} урона (${source}).`);
      addEffect(enemy.x, enemy.y, element ? ELEMENT_COLORS[element] : "#ffffff", 6, String(finalAmount));
      if (enemy.illusion && finalAmount > 0 && enemy.hp > 0) {
        enemy.hp = 0;
      }
      if (enemy.hp <= 0) {
        addLog(enemy.defeatText || `${enemy.name} побежден.`);
        removeEnemy(enemy);
        context.behaviors.artifactHooks.run(context, "enemyDefeated", { enemy, element });
        handleChallengeEnemyDefeat(enemy);
        if (enemy.boss) {
          handleBossDefeat(enemy);
        }
        return true;
      }
      refreshMirrorResistance(enemy, element);
      return false;
    }

    function handleBossDefeat(enemy) {
      clearBossSummons(enemy);
      clearBossExitCell(enemy);
      grantBossMagicShardReward(state.floor);
      if (state.floor >= CONFIG.maxFloors) {
        addLog("Сердце башни разбито. Башня спасена.");
        setMode(MODES.VICTORY);
        return;
      }

      if (openBossRelicChoice(state.floor, enemy)) {
        return;
      }

      spawnBossStairs(enemy);
    }

    function applyFirstDamageReduction(amount) {
      let remaining = amount;
      const flags = artifactFlags();
      if (state.player.relicFirstDamageReductionAvailable && flags.firstDamageReduction > 0) {
        const reduced = Math.min(remaining, flags.firstDamageReduction);
        remaining -= reduced;
        state.player.relicFirstDamageReductionAvailable = false;
        if (reduced > 0) {
          addLog(`Ядро стойкости снижает первый урон этажа на ${reduced}.`);
        }
      }
      return remaining;
    }

    function applyDamageShieldArtifact() {
      const flags = artifactFlags();
      if (flags.damageShield <= 0 || state.player.windFeatherCooldown > 0) {
        return;
      }
      state.player.shield += flags.damageShield;
      state.player.windFeatherCooldown = flags.damageShieldCooldown || 4;
      addLog(`Перо вихря дает ${flags.damageShield} щита после удара.`);
    }

    function applyBastionShardRelic() {
      const flags = artifactFlags();
      if (flags.bastionShield <= 0 || state.player.bastionShardCooldown > 0) {
        return;
      }
      state.player.shield += flags.bastionShield;
      state.player.bastionShardCooldown = flags.bastionShieldCooldown || 3;
      addLog(`Осколок бастиона дает ${flags.bastionShield} щит после удара.`);
    }

    function applyReflectionShardRelic(sourceEnemy) {
      const flags = artifactFlags();
      if (!state.player.relicReflectAvailable || flags.firstDamageReflect <= 0) {
        return;
      }
      state.player.relicReflectAvailable = false;
      if (!sourceEnemy || !state.enemies.includes(sourceEnemy)) {
        return;
      }
      addLog(`Осколок отражения возвращает ${flags.firstDamageReflect} урон атакующему.`);
      damageEnemy(sourceEnemy, flags.firstDamageReflect, "осколок отражения");
    }

    function triggerLastChanceArtifact() {
      const artifact = ownedArtifactById("lastChanceStone");
      if (!artifact || artifact.active === false || artifact.spent) {
        return false;
      }
      artifact.active = false;
      artifact.spent = true;
      state.player.hp = 1;
      state.player.shield += 4;
      refreshArtifactFlags();
      addLog("Камень последнего шанса раскалывается: маг остается с 1 здоровьем и получает 4 щита.");
      return true;
    }

    function damagePlayer(amount, message, sourceEnemy = null) {
      if (amount <= 0 || state.mode !== MODES.PLAYING) {
        return;
      }
      if (state.player.floorBlockAvailable) {
        state.player.floorBlockAvailable = false;
        addLog("Осторожный исследователь блокирует первый урон этажа.");
        return;
      }
      let remaining = amount;
      const damageParams = { remaining, sourceEnemy };
      context.behaviors.artifactHooks.run(context, "beforeDamageTaken", damageParams);
      remaining = damageParams.remaining;
      const flags = artifactFlags();
      if (state.player.damageReductionTurns > 0 && state.player.damageReduction > 0) {
        const reduced = Math.min(remaining, state.player.damageReduction);
        remaining -= reduced;
        if (reduced > 0) {
          addLog(`Гранитный панцирь снижает урон на ${reduced}.`);
        }
      }
      if (remaining > 0 && state.player.damageMarkBonus > 0) {
        const markBonus = state.player.damageMarkBonus;
        remaining += markBonus;
        state.player.damageMarkBonus = 0;
        state.player.damageMarkSource = "";
        addLog(`Метка культиста вспыхивает: урон увеличен на ${markBonus}.`);
      }
      if (state.player.shield > 0) {
        const blocked = Math.min(state.player.shield, remaining);
        state.player.shield -= blocked;
        remaining -= blocked;
        addLog(`Щит поглощает ${blocked} урона.`);
      }
      if (remaining > 0) {
        state.player.hp -= remaining;
        addLog(`${message} Вы теряете ${remaining} здоровья.`);
        addEffect(state.player.x, state.player.y, "#ff4d5a", 8, String(remaining));
        if (state.player.hp > 0) {
          context.behaviors.artifactHooks.run(context, "afterDamageTaken", { sourceEnemy });
        }
      }
      if (state.player.hp <= 0) {
        if (context.behaviors.artifactHooks.run(
          context,
          "beforePlayerDefeat",
          {},
          { stopOnHandled: true }
        )) {
          return;
        }
        state.player.hp = 0;
        addLog("Башня забирает последнюю искру мага.");
        setMode(MODES.GAME_OVER);
      }
    }

    function advanceTurn(enemyPhase = true) {
      if (state.mode !== MODES.PLAYING) {
        return;
      }
      state.turn += 1;
      updateVision();
      checkSecretEntranceProximity();
      tickHazardsAndStatuses();
      if (enemyPhase && state.mode === MODES.PLAYING) {
        actEnemies();
      }
      tickBarriers();
      tickPlayerStatuses();
      const regenEvery = state.player.manaRegenEvery;
      if (state.turn % regenEvery === 0 && state.player.mana < state.player.maxMana) {
        state.player.mana += 1;
        addLog("Мана восстанавливается на 1.");
      }
      updateUI();
    }

    function applyAcid(enemy, hazard) {
      const turns = hazard.acidTurns || 0;
      if (turns <= 0 || !state.enemies.includes(enemy)) {
        return;
      }
      const wasAcidic = enemy.acidTurns > 0;
      enemy.acidTurns = Math.max(enemy.acidTurns, turns);
      enemy.acidBonus = Math.max(enemy.acidBonus || 0, hazard.acidBonus || 1);
      if (!wasAcidic) {
        addLog(`${enemy.name} покрыт кислотой.`);
      }
    }

    function spreadPlagueCloud(cell, sourceHazard) {
      state.hazards.push({
        id: nextId(),
        type: "poison",
        x: cell.x,
        y: cell.y,
        radius: 1,
        turns: sourceHazard.spreadTurns || 2,
        damage: Math.max(1, sourceHazard.damage || 1),
        spreadOnDeath: true,
        spreadTurns: sourceHazard.spreadTurns || 2,
      });
      addEffect(cell.x, cell.y, ELEMENT_COLORS.poison, 8, "чума");
      addLog("Чумное облако расползается от павшего врага.");
    }

    function tickBarriers() {
      state.barriers.forEach((barrier) => {
        barrier.turns -= 1;
      });
      state.barriers = state.barriers.filter((barrier) => barrier.turns > 0);
    }

    function tickPlayerStatuses() {
      if (state.player.damageReductionTurns > 0) {
        state.player.damageReductionTurns -= 1;
        if (state.player.damageReductionTurns <= 0) {
          state.player.damageReduction = 0;
        }
      }
      if (state.player.windFeatherCooldown > 0) {
        state.player.windFeatherCooldown -= 1;
      }
      if (state.player.bastionShardCooldown > 0) {
        state.player.bastionShardCooldown -= 1;
      }
    }

    function tickHazardsAndStatuses() {
      state.hazards.forEach((hazard) => {
        [...state.enemies].forEach((enemy) => {
          if (!state.enemies.includes(enemy)) {
            return;
          }
          if (distance(enemy, hazard) <= hazard.radius) {
            const deathCell = { x: enemy.x, y: enemy.y };
            if (hazard.type === "fire") {
              const died = damageEnemy(enemy, hazard.damage || 1, "пирокласт", "fire");
              if (!died && state.enemies.includes(enemy)) {
                enemy.burn = Math.max(enemy.burn, hazard.burnTurns || 2);
              }
            } else if (hazard.type === "poison" || hazard.type === "acid") {
              const died = damageEnemy(enemy, hazard.damage || 1, hazard.label || "ядовитое облако", "poison");
              if (died && hazard.spreadOnDeath) {
                spreadPlagueCloud(deathCell, hazard);
              } else if (!died && hazard.type === "acid") {
                applyAcid(enemy, hazard);
              }
            }
          }
        });
        if (distance(state.player, hazard) <= hazard.radius && hazard.type === "danger") {
          damagePlayer(1, "Опасная клетка вспыхивает.");
        }
        hazard.turns -= 1;
      });
      state.hazards = state.hazards.filter((hazard) => hazard.turns > 0);

      [...state.enemies].forEach((enemy) => {
        if (!state.enemies.includes(enemy)) {
          return;
        }
        if (enemy.lifetime > 0) {
          enemy.lifetime -= 1;
          if (enemy.lifetime <= 0) {
            addLog(enemy.defeatText || `${enemy.name} исчезает.`);
            removeEnemy(enemy);
            return;
          }
        }
        if (enemy.resistTurns > 0) {
          enemy.resistTurns -= 1;
        }
        if (enemy.acidTurns > 0) {
          enemy.acidTurns -= 1;
          if (enemy.acidTurns <= 0) {
            enemy.acidBonus = 0;
          }
        }
        if (enemy.curseMarkTurns > 0) {
          enemy.curseMarkTurns -= 1;
          if (enemy.curseMarkTurns <= 0) {
            enemy.curseMarkHits = 0;
            enemy.curseMarkBonus = 0;
          }
        }
        if (enemy.burn > 0) {
          enemy.burn -= 1;
          damageEnemy(enemy, 1 + artifactFlags().burnTickBonus, "горение", "fire");
        }
        if (!state.enemies.includes(enemy)) {
          return;
        }
        if (enemy.poison > 0) {
          enemy.poison -= 1;
          damageEnemy(enemy, 1, "яд", "poison");
        }
        if (!state.enemies.includes(enemy)) {
          return;
        }
        if (enemy.slow > 0) {
          enemy.slow -= 1;
        }
      });
    }

    const localApi = {
      adjustEnemyDamage,
      refreshMirrorResistance,
      applyDamageVulnerabilities,
      handleArtifactEnemyKill,
      removeEnemy,
      clearBossSummons,
      damageEnemy,
      handleBossDefeat,
      applyFirstDamageReduction,
      applyDamageShieldArtifact,
      applyBastionShardRelic,
      applyReflectionShardRelic,
      triggerLastChanceArtifact,
      damagePlayer,
      advanceTurn,
      applyAcid,
      spreadPlagueCloud,
      tickBarriers,
      tickPlayerStatuses,
      tickHazardsAndStatuses,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerSystem("combat", installCombat);
})(globalThis);
