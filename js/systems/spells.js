// Spell casting, upgrades, evolutions, targeting, and spell-side hooks.
(function registerSpellssystem(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerSystem !== "function") {
    throw new Error("MagicTower.registerSystem must load before js/systems/spells.js");
  }

  MagicTower.registerBehavior("spells", Object.freeze({
    fireball: (context, spell, params) => context.api.castFireballSpell(spell, params.evolution),
    iceShard: (context, spell, params) => context.api.castIceShardSpell(spell, params.evolution),
    poisonCloud: (context, spell, params) => context.api.castPoisonCloudSpell(spell, params.evolution),
    chainLightning: (context, spell, params) => context.api.castChainLightningSpell(spell, params.evolution),
    dawnRay: (context, spell, params) => context.api.castDawnRaySpell(spell, params.evolution),
    shadowSpike: (context, spell, params) => context.api.castShadowSpikeSpell(spell, params.evolution),
    stoneArmor: (context, spell, params) => context.api.castStoneArmorSpell(spell, params.evolution),
    windGust: (context, spell, params) => context.api.castWindGustSpell(spell, params.evolution),
    magicMissile: (context, spell, params) => context.api.castMagicMissileSpell(spell, params.evolution),
  }));

  /**
   * Installs the spells API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installSpells(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("spells requires a GameContext with an api object.");
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
      SPELLS,
    } = data;

    function randomInt(...args) {
      const implementation = context.api.randomInt;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function randomInt is not installed.");
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

    function spellCost(...args) {
      const implementation = context.api.spellCost;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function spellCost is not installed.");
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

    function artifactFlags(...args) {
      const implementation = context.api.artifactFlags;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function artifactFlags is not installed.");
      }
      return implementation(...args);
    }

    function spellUpgradeTotal(...args) {
      const implementation = context.api.spellUpgradeTotal;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function spellUpgradeTotal is not installed.");
      }
      return implementation(...args);
    }

    function spellUpgradeOverride(...args) {
      const implementation = context.api.spellUpgradeOverride;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function spellUpgradeOverride is not installed.");
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

    function isWalkable(...args) {
      const implementation = context.api.isWalkable;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function isWalkable is not installed.");
      }
      return implementation(...args);
    }

    function isVisibleCell(...args) {
      const implementation = context.api.isVisibleCell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function isVisibleCell is not installed.");
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

    function tryOpenSecretEntranceWithSpell(...args) {
      const implementation = context.api.tryOpenSecretEntranceWithSpell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function tryOpenSecretEntranceWithSpell is not installed.");
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

    function sameCell(...args) {
      const implementation = context.api.sameCell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function sameCell is not installed.");
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

    function damageEnemy(...args) {
      const implementation = context.api.damageEnemy;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function damageEnemy is not installed.");
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

    function pushEnemy(...args) {
      const implementation = context.api.pushEnemy;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function pushEnemy is not installed.");
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

    function applyArtifactAfterSpellCast(spell) {
      const flags = artifactFlags();
      if (spell.element === "wind" && flags.windSpellShield > 0) {
        state.player.shield += flags.windSpellShield;
        addLog(`Перо вихря дает ${flags.windSpellShield} щита за заклинание ветра.`);
      }
    }

    function updateGlassMemoryAfterSpellCast(spell, discountWasUsed) {
      const flags = artifactFlags();
      if (flags.glassMemoryDiscount <= 0) {
        return;
      }

      if (discountWasUsed) {
        state.player.glassMemoryDiscountAvailable = false;
        state.player.glassMemoryChain = [spell.id];
        addLog("Стеклянная память сбрасывает узор после скидки.");
        return;
      }

      const chain = state.player.glassMemoryChain || [];
      const existingIndex = chain.indexOf(spell.id);
      const nextChain = existingIndex >= 0
        ? chain.slice(existingIndex + 1)
        : [...chain];
      nextChain.push(spell.id);

      if (nextChain.length >= 3) {
        state.player.glassMemoryChain = [];
        state.player.glassMemoryDiscountAvailable = true;
        addLog("Стеклянная память готовит скидку для следующего заклинания.");
      } else {
        state.player.glassMemoryChain = nextChain;
      }
    }

    function castSelectedSpell() {
      const spellId = state.player.spells[state.selectedSpellIndex];
      if (!spellId) {
        addLog("В этом слоте нет заклинания.");
        return;
      }
      const spell = SPELLS[spellId];
      const isFree = state.player.freeSpellAvailable;
      const cost = spellCost(spell);
      if (!isFree && state.player.mana < cost) {
        addLog("Не хватает маны.");
        return;
      }

      // Общий вход для заклинаний держит цену, лог и передачу хода в одном месте.
      state.pendingManaRefund = 0;
      state.currentSpellDamageBonus = state.player.nextSpellDamageBonus || 0;
      const flags = artifactFlags();
      const castParams = {
        spell,
        shouldEcho: false,
        echoMessage: null,
        echoManaRefund: 0,
      };
      context.behaviors.artifactHooks.run(context, "beforeSpellCast", castParams);
      const usedGlassMemoryDiscount = flags.glassMemoryDiscount > 0 && state.player.glassMemoryDiscountAvailable;
      const spellActed = castSpell(spell);
      const secretOpened = tryOpenSecretEntranceWithSpell(spell);
      const acted = spellActed || secretOpened;
      if (acted) {
        state.player.nextSpellDamageBonus = 0;
        if (spellActed) {
          context.behaviors.artifactHooks.run(context, "afterSpellCast", { spell });
        }
        if (spellActed && castParams.shouldEcho && state.mode === MODES.PLAYING) {
          addLog(castParams.echoMessage || "Первое заклинание этажа повторяется.");
          const echoed = castSpell(spell);
          if (echoed) {
            context.behaviors.artifactHooks.run(context, "afterSpellCast", { spell });
            state.pendingManaRefund += castParams.echoManaRefund;
          }
        }
        if (!isFree) {
          state.player.mana -= cost;
        } else {
          state.player.freeSpellAvailable = false;
          addLog("Экономный колдун сохраняет ману.");
        }
        if (usedGlassMemoryDiscount) {
          addLog(`Стеклянная память снижает стоимость заклинания на ${flags.glassMemoryDiscount} ману.`);
        }
        if (state.pendingManaRefund > 0) {
          const refund = state.pendingManaRefund;
          state.player.mana = Math.min(state.player.maxMana, state.player.mana + refund);
          addLog(`Магия возвращает ${refund} маны.`);
        }
        state.pendingManaRefund = 0;
        state.currentSpellDamageBonus = 0;
        state.player.spellsCastThisFloor += 1;
        state.player.lastSpellElement = spell.element;
        context.behaviors.artifactHooks.run(context, "afterSpellResolved", {
          spell,
          discountWasUsed: usedGlassMemoryDiscount,
        });
        addEffect(state.player.x, state.player.y, ELEMENT_COLORS[spell.element], 5, spell.name);
        advanceTurn();
      } else {
        state.currentSpellDamageBonus = 0;
      }
    }

    function applyOverloadStun(enemy, evolution) {
      if (evolution?.id !== "overload" || !state.enemies.includes(enemy)) {
        return;
      }
      if (context.rng.next() < evolution.stunChance) {
        enemy.stun = Math.max(enemy.stun, evolution.stunTurns);
        addLog(`${enemy.name} оглушен перегрузкой.`);
        addEffect(enemy.x, enemy.y, ELEMENT_COLORS.lightning, 7, "!");
      }
    }

    function castChainLightningSpell(spell, evolution) {
      const first = nearestEnemy(spell.range);
      if (!first) {
        addLog("Молния не нашла цель.");
        return false;
      }

      damageEnemy(first, spellDamage(spell, first), spell.name, spell.element);
      applyOverloadStun(first, evolution);
      addEffect(first.x, first.y, ELEMENT_COLORS.lightning, 8, "молния");

      let jumpSource = first;
      const hitIds = new Set([first.id]);
      const lightningChainBonus = artifactFlags().lightningChainBonus || 0;
      const baseJumps = spellUpgradeOverride(spell.id, "chainJumps", 1) + lightningChainBonus;
      const maxJumps = evolution?.id === "overload"
        ? evolution.maxJumps + lightningChainBonus
        : baseJumps + (evolution?.id === "stormChain" ? evolution.jumpBonus : 0);
      const jumpRange = evolution?.jumpRange || 4;

      for (let jump = 1; jump <= maxJumps; jump += 1) {
        const next = state.enemies
          .filter((enemy) =>
            enemy.hp > 0 &&
            !hitIds.has(enemy.id) &&
            isVisibleCell(enemy.x, enemy.y) &&
            distance(enemy, jumpSource) <= jumpRange
          )
          .sort((a, b) => distance(a, jumpSource) - distance(b, jumpSource))[0];
        if (!next) {
          break;
        }
        hitIds.add(next.id);
        damageEnemy(next, Math.max(1, spellDamage(spell, next) - jump), "скачок молнии", spell.element);
        applyOverloadStun(next, evolution);
        addEffect(next.x, next.y, ELEMENT_COLORS.lightning, 8, "молния");
        jumpSource = next;
      }
      return true;
    }

    function placeEarthBastion(evolution) {
      const placed = [];
      const preferredDirections = nearbyEnemies(state.player, 8)
        .map((enemy) => {
          const dx = enemy.x - state.player.x;
          const dy = enemy.y - state.player.y;
          return Math.abs(dx) >= Math.abs(dy)
            ? { x: Math.sign(dx), y: 0 }
            : { x: 0, y: Math.sign(dy) };
        });
      const fallback = state.lastMoveDir.x || state.lastMoveDir.y ? state.lastMoveDir : { x: 1, y: 0 };
      const directions = [...preferredDirections, fallback, { x: -fallback.y, y: fallback.x }, { x: fallback.y, y: -fallback.x }];
      const candidates = [];

      directions.forEach((dir) => {
        for (let step = 1; step <= 2; step += 1) {
          const base = { x: state.player.x + dir.x * step, y: state.player.y + dir.y * step };
          const sideA = { x: base.x - dir.y, y: base.y + dir.x };
          const sideB = { x: base.x + dir.y, y: base.y - dir.x };
          [base, sideA, sideB].forEach((cell) => {
            if (!candidates.some((existing) => sameCell(existing, cell))) {
              candidates.push(cell);
            }
          });
        }
      });

      candidates.forEach((cell) => {
        if (
          placed.length >= evolution.barrierCount ||
          !isFreeCell(cell.x, cell.y) ||
          wouldLeavePlayerEscape(cell)
        ) {
          return;
        }
        const barrier = {
          id: nextId(),
          x: cell.x,
          y: cell.y,
          turns: evolution.barrierTurns,
        };
        state.barriers.push(barrier);
        placed.push(barrier);
        addEffect(cell.x, cell.y, ELEMENT_COLORS.earth, 8, "кам");
      });

      return placed.length;
    }

    function tryWindStep(evolution) {
      const dir = state.lastMoveDir.x || state.lastMoveDir.y ? state.lastMoveDir : { x: 1, y: 0 };
      let moved = 0;
      for (let step = 0; step < evolution.steps; step += 1) {
        const next = { x: state.player.x + dir.x, y: state.player.y + dir.y };
        if (
          !isWalkable(next.x, next.y) ||
          barrierAt(next.x, next.y) ||
          enemyAt(next.x, next.y) ||
          objectAt(next.x, next.y)
        ) {
          break;
        }
        state.player.x = next.x;
        state.player.y = next.y;
        moved += 1;
        addEffect(next.x, next.y, ELEMENT_COLORS.wind, 6, "вет");
      }
      if (moved > 0) {
        updateVision();
      }
      return moved;
    }

    function castSpell(spell) {
      const handler = context.behaviors.spells[spell.behaviorId || spell.id];
      if (typeof handler !== "function") {
        throw new Error(`Missing spell behavior: ${spell.behaviorId || spell.id}.`);
      }
      return handler(context, spell, { evolution: spellEvolution(spell.id) });
    }

    function castTargetedSpell(spell, evolution, behavior = {}) {
      const target = behavior.chooseTarget
        ? behavior.chooseTarget()
        : firstEnemyOnLine(spell.range) || nearestEnemy(spell.range);
      if (!target) {
        addLog(`${spell.name}: нет цели в пределах действия.`);
        return false;
      }

      let damage = spellDamage(spell, target);
      if (behavior.modifyDamage) {
        damage = behavior.modifyDamage(damage, target);
      }
      const source = behavior.source ? behavior.source(target) : spell.name;
      const died = damageEnemy(target, damage, source, spell.element);
      addEffect(target.x, target.y, ELEMENT_COLORS[spell.element], 8, spell.name);
      behavior.afterHit?.({ target, died, damage });
      return true;
    }

    function castStoneArmorSpell(spell, evolution) {
      const flags = artifactFlags();
      const amount = 3 +
        state.player.earthShieldBonus +
        flags.earthShieldBonus +
        spellUpgradeTotal(spell.id, "shieldBonus") +
        (evolution?.shieldBonus || 0);
      state.player.shield += amount;

      if (evolution?.id === "graniteCarapace") {
        state.player.damageReduction = Math.max(state.player.damageReduction, evolution.reduction);
        state.player.damageReductionTurns = Math.max(state.player.damageReductionTurns, evolution.reductionTurns);
        addLog(`Гранитный панцирь дает ${amount} щита и снижает входящий урон.`);
      } else if (evolution?.id === "earthBastion") {
        const barriers = placeEarthBastion(evolution);
        addLog(`Земной бастион дает ${amount} щита и поднимает преграды: ${barriers}.`);
      } else {
        addLog(`Каменная броня дает ${amount} щита.`);
      }
      return true;
    }

    function castWindGustSpell(spell, evolution) {
      const flags = artifactFlags();
      if (evolution?.id === "windStep") {
        const moved = tryWindStep(evolution);
        state.player.shield += evolution.shield;
        addLog(`Шаг ветра переносит мага на ${moved} кл. и дает ${evolution.shield} щита.`);
        return true;
      }

      const range = spell.range + (evolution?.id === "hurricaneWall" ? evolution.rangeBonus : 0);
      const targets = state.enemies.filter((enemy) =>
        enemy.hp > 0 &&
        isVisibleCell(enemy.x, enemy.y) &&
        distance(enemy, state.player) <= range
      );
      if (!targets.length) {
        addLog("Порыву ветра некого оттолкнуть.");
        return false;
      }
      targets.forEach((enemy) => {
        const died = damageEnemy(enemy, spellDamage(spell, enemy), spell.name, spell.element);
        if (died || !state.enemies.includes(enemy)) {
          return;
        }
        const pushSteps = 2 +
          state.player.windPushBonus +
          flags.windPushBonus +
          (evolution?.id === "hurricaneWall" ? evolution.pushBonus : 0);
        const pushResult = pushEnemy(enemy, pushSteps);
        const collisionDamage = spellUpgradeTotal(spell.id, "collisionDamage") +
          (evolution?.id === "hurricaneWall" ? evolution.collisionDamageBonus : 0);
        if (collisionDamage > 0 && pushResult.blocked && state.enemies.includes(enemy)) {
          damageEnemy(enemy, collisionDamage, "столкновение с преградой", spell.element);
        }
      });
      return true;
    }

    function castPoisonCloudSpell(spell, evolution) {
      const flags = artifactFlags();
      const target = nearestEnemy(spell.range);
      const center = target || {
        x: state.player.x + state.lastMoveDir.x * Math.min(3, spell.range),
        y: state.player.y + state.lastMoveDir.y * Math.min(3, spell.range),
      };
      const safeCenter = isWalkable(center.x, center.y) && !barrierAt(center.x, center.y)
        ? center
        : { x: state.player.x, y: state.player.y };
      const hazard = {
        id: nextId(),
        type: evolution?.id === "acidMist" ? "acid" : "poison",
        x: safeCenter.x,
        y: safeCenter.y,
        radius: 1,
        turns: 3 + state.player.poisonBonusTurns + spellUpgradeTotal(spell.id, "hazardTurnsBonus") + flags.poisonHazardTurns,
        damage: spellUpgradeOverride(spell.id, "hazardDamage", 1) + flags.poisonHazardDamage,
        label: evolution?.id === "acidMist" ? "кислотный туман" : "ядовитое облако",
      };
      if (evolution?.id === "plagueCloud") {
        hazard.spreadOnDeath = true;
        hazard.spreadTurns = evolution.spreadTurns;
      }
      if (evolution?.id === "acidMist") {
        hazard.acidTurns = evolution.acidTurns;
        hazard.acidBonus = evolution.acidBonus;
      }
      state.hazards.push(hazard);
      addLog(evolution?.id === "acidMist"
        ? "Кислотный туман расползается по плитам."
        : "Ядовитое облако расползается по плитам.");
      addEffect(safeCenter.x, safeCenter.y, ELEMENT_COLORS.poison, 8, evolution?.id === "acidMist" ? "кис" : "яд");
      return true;
    }

    function castFireballSpell(spell, evolution) {
      const flags = artifactFlags();
      return castTargetedSpell(spell, evolution, {
        source: () => evolution?.id === "solarMeteor" ? evolution.name : spell.name,
        modifyDamage(damage, target) {
          if (evolution?.id === "solarMeteor") {
            damage += evolution.damageBonus;
            if (target.burn > 0) {
              target.burn = 0;
              damage += evolution.burnConsumeBonus;
              addLog("Солнечный метеор поглощает горение цели.");
            }
          }
          return damage;
        },
        afterHit({ target, died }) {
          if (evolution?.id === "pyroclast") {
            state.hazards.push({
              id: nextId(),
              type: "fire",
              x: target.x,
              y: target.y,
              radius: 1,
              turns: evolution.hazardTurns,
              damage: evolution.hazardDamage,
              burnTurns: evolution.burnTurns + flags.fireBurnBonusTurns,
            });
            if (!died && state.enemies.includes(target)) {
              target.burn = Math.max(target.burn, evolution.burnTurns + flags.fireBurnBonusTurns);
            }
            addLog("Пирокласт оставляет горящую область.");
          } else if (evolution?.id !== "solarMeteor" && target.hp > 0 && context.rng.next() < 0.45) {
            target.burn = spellUpgradeOverride(spell.id, "burnTurns", 2) + flags.fireBurnBonusTurns;
            addLog(`${target.name} горит.`);
          }
        },
      });
    }

    function castIceShardSpell(spell, evolution) {
      const flags = artifactFlags();
      return castTargetedSpell(spell, evolution, {
        afterHit({ target, died }) {
          if (evolution?.id === "icePrison" && !died && state.enemies.includes(target)) {
            target.slow = Math.max(target.slow, evolution.slowTurns + flags.iceSlowBonusTurns);
            addLog(`${target.name} скован ледяной тюрьмой.`);
          } else if (evolution?.id === "shardStorm") {
            if (!died && state.enemies.includes(target)) {
              target.slow = Math.max(target.slow, evolution.slowTurns + flags.iceSlowBonusTurns);
            }
            nearbyEnemies(target, evolution.sideRadius, new Set([target.id]))
              .slice(0, evolution.sideTargets)
              .forEach((enemy) => {
                const sideDamage = Math.max(1, spellDamage(spell, enemy) - evolution.sideDamagePenalty);
                damageEnemy(enemy, sideDamage, evolution.name, spell.element);
                if (state.enemies.includes(enemy)) {
                  enemy.slow = Math.max(enemy.slow, evolution.slowTurns + flags.iceSlowBonusTurns);
                }
                addEffect(enemy.x, enemy.y, ELEMENT_COLORS.ice, 8, "лед");
              });
            addLog("Осколочная буря разлетается по ближайшим целям.");
          } else if (target.hp > 0) {
            const slowMin = spellUpgradeOverride(spell.id, "slowMin", 2);
            const slowMax = spellUpgradeOverride(spell.id, "slowMax", 3);
            target.slow = Math.max(target.slow, randomInt(slowMin, slowMax) + flags.iceSlowBonusTurns);
            addLog(`${target.name} замедлен.`);
          }
        },
      });
    }

    function castDawnRaySpell(spell, evolution) {
      const flags = artifactFlags();
      if (evolution?.id === "holyCircle") {
        const targets = nearbyEnemies(state.player, evolution.radius);
        let kills = 0;
        targets.forEach((enemy) => {
          const damage = Math.max(1, spellDamage(spell, enemy) - evolution.damagePenalty);
          if (damageEnemy(enemy, damage, evolution.name, spell.element)) {
            kills += 1;
          }
          addEffect(enemy.x, enemy.y, ELEMENT_COLORS.light, 8, "свет");
        });
        const heal = evolution.heal + state.player.lightHealBonus + flags.lightHealBonus + spellUpgradeTotal(spell.id, "healBonus") + kills;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
        state.player.shield += evolution.shield;
        addLog(`Священный круг лечит ${heal} здоровья и дает ${evolution.shield} щита.`);
        return true;
      }
      if (evolution?.id === "dawnSpear") {
        const targets = enemiesOnLine(spell.range);
        if (!targets.length) {
          addLog("Копье зари не нашло цель на линии.");
          return false;
        }
        let kills = 0;
        targets.forEach((enemy) => {
          let damage = spellDamage(spell, enemy) + evolution.damageBonus;
          if (enemy.tags.includes("undead")) {
            damage += spellUpgradeOverride(spell.id, "undeadBonus", 2);
          }
          if (damageEnemy(enemy, damage, evolution.name, spell.element)) {
            kills += 1;
          }
          addEffect(enemy.x, enemy.y, ELEMENT_COLORS.light, 8, "коп");
        });
        const heal = 1 + state.player.lightHealBonus + flags.lightHealBonus + spellUpgradeTotal(spell.id, "healBonus") + kills;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
        addLog(`Копье зари лечит ${heal} здоровья.`);
        return true;
      }
      return castTargetedSpell(spell, evolution, {
        modifyDamage(damage, target) {
          return target.tags.includes("undead")
            ? damage + spellUpgradeOverride(spell.id, "undeadBonus", 2)
            : damage;
        },
        afterHit({ died }) {
          const heal = 1 + state.player.lightHealBonus + flags.lightHealBonus + spellUpgradeTotal(spell.id, "healBonus") + (died ? 1 : 0);
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
          addLog(`Луч рассвета лечит ${heal} здоровья.`);
        },
      });
    }

    function castShadowSpikeSpell(spell, evolution) {
      const flags = artifactFlags();
      return castTargetedSpell(spell, evolution, {
        chooseTarget: () => evolution?.id === "twilightBlade"
          ? nearestWoundedEnemy(spell.range) || firstEnemyOnLine(spell.range) || nearestEnemy(spell.range)
          : firstEnemyOnLine(spell.range) || nearestEnemy(spell.range),
        modifyDamage(damage, target) {
          if (target.hp < target.maxHp) {
            damage += 2 + state.player.shadowWoundBonus + flags.shadowWoundBonus + spellUpgradeTotal(spell.id, "woundedBonus");
            if (evolution?.id === "twilightBlade") {
              damage += evolution.executeBonus;
            }
          }
          return damage;
        },
        afterHit({ target, died }) {
          if (evolution?.id === "twilightBlade" && died) {
            state.pendingManaRefund += evolution.manaRefund;
          } else if (evolution?.id === "cursedMark" && !died && state.enemies.includes(target)) {
            target.curseMarkTurns = Math.max(target.curseMarkTurns, evolution.markTurns);
            target.curseMarkHits = Math.max(target.curseMarkHits, evolution.markHits);
            target.curseMarkBonus = Math.max(target.curseMarkBonus, evolution.markBonus);
            addLog(`${target.name} отмечен проклятой меткой.`);
          }
        },
      });
    }

    function castMagicMissileSpell(spell, evolution) {
      return castTargetedSpell(spell, evolution, {
        afterHit({ target, died }) {
          if (evolution?.id === "echoMissile") {
            const echoTarget = nearbyEnemies(state.player, spell.range, new Set([target.id]))[0];
            if (echoTarget) {
              const echoDamage = Math.max(1, Math.round(spellDamage(spell, echoTarget) * evolution.echoMultiplier));
              damageEnemy(echoTarget, echoDamage, evolution.name, spell.element);
              addEffect(echoTarget.x, echoTarget.y, ELEMENT_COLORS.arcane, 8, "эхо");
            }
          } else if (evolution?.id === "manaNeedle" && died) {
            state.pendingManaRefund += evolution.manaRefund;
          }
        },
      });
    }

    function hasNegativeStatus(enemy) {
      return Boolean(
        enemy.burn > 0 ||
        enemy.poison > 0 ||
        enemy.slow > 0 ||
        enemy.stun > 0 ||
        enemy.acidTurns > 0 ||
        enemy.curseMarkTurns > 0
      );
    }

    function spellDamage(spell, enemy) {
      const flags = artifactFlags();
      const elementBonus = state.player.elementBonus[spell.element] || 0;
      const weaknessBonus = enemy.weakTo.includes(spell.element) ? 1 : 0;
      const upgradeBonus = spellUpgradeTotal(spell.id, "damageBonus");
      let artifactDamageBonus = (state.currentSpellDamageBonus || 0) + (state.player.floorSpellDamageBonus || 0);
      if (spell.element === "fire" && enemy.burn > 0) {
        artifactDamageBonus += flags.fireDamageToBurning;
      }
      if (spell.element === "ice" && enemy.slow > 0) {
        artifactDamageBonus += flags.iceDamageToSlowed;
      }
      if (spell.element === "lightning") {
        artifactDamageBonus += flags.lightningDamageBonus;
      }
      if (spell.element === "light") {
        artifactDamageBonus += flags.lightDamageBonus;
      }
      if (spell.element === "shadow") {
        artifactDamageBonus += flags.shadowDamageBonus;
      }
      const scaled = (spell.baseDamage + upgradeBonus + state.player.flatSpellBonus + weaknessBonus + artifactDamageBonus) *
        (state.player.spellDamageMultiplier + elementBonus);
      return Math.max(1, Math.round(scaled));
    }

    function firstEnemyOnLine(range) {
      const dir = state.lastMoveDir;
      if (!dir.x && !dir.y) {
        return null;
      }
      let x = state.player.x;
      let y = state.player.y;
      for (let step = 0; step < range; step += 1) {
        x += dir.x;
        y += dir.y;
        if (!isWalkable(x, y) || barrierAt(x, y)) {
          return null;
        }
        const enemy = enemyAt(x, y);
        if (enemy) {
          return isVisibleCell(enemy.x, enemy.y) ? enemy : null;
        }
      }
      return null;
    }

    function nearestEnemy(range) {
      return state.enemies
        .filter((enemy) =>
          enemy.hp > 0 &&
          isVisibleCell(enemy.x, enemy.y) &&
          distance(enemy, state.player) <= range
        )
        .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0] || null;
    }

    function enemiesOnLine(range) {
      const dir = state.lastMoveDir;
      if (!dir.x && !dir.y) {
        return [];
      }
      const targets = [];
      let x = state.player.x;
      let y = state.player.y;
      for (let step = 0; step < range; step += 1) {
        x += dir.x;
        y += dir.y;
        if (!isWalkable(x, y) || barrierAt(x, y)) {
          break;
        }
        const enemy = enemyAt(x, y);
        if (enemy && isVisibleCell(enemy.x, enemy.y)) {
          targets.push(enemy);
        }
      }
      return targets;
    }

    function nearestWoundedEnemy(range) {
      return state.enemies
        .filter((enemy) =>
          enemy.hp > 0 &&
          enemy.hp < enemy.maxHp &&
          isVisibleCell(enemy.x, enemy.y) &&
          distance(enemy, state.player) <= range
        )
        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp) || distance(a, state.player) - distance(b, state.player))[0] || null;
    }

    function nearbyEnemies(center, range, excludeIds = new Set()) {
      return state.enemies
        .filter((enemy) =>
          enemy.hp > 0 &&
          !excludeIds.has(enemy.id) &&
          isVisibleCell(enemy.x, enemy.y) &&
          distance(enemy, center) <= range
        )
        .sort((a, b) => distance(a, center) - distance(b, center));
    }

    const localApi = {
      applyArtifactAfterSpellCast,
      updateGlassMemoryAfterSpellCast,
      castSelectedSpell,
      applyOverloadStun,
      castChainLightningSpell,
      castFireballSpell,
      castIceShardSpell,
      castPoisonCloudSpell,
      castDawnRaySpell,
      castShadowSpikeSpell,
      castStoneArmorSpell,
      castWindGustSpell,
      castMagicMissileSpell,
      placeEarthBastion,
      tryWindStep,
      castSpell,
      hasNegativeStatus,
      spellDamage,
      firstEnemyOnLine,
      nearestEnemy,
      enemiesOnLine,
      nearestWoundedEnemy,
      nearbyEnemies,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerSystem("spells", installSpells);
})(globalThis);
