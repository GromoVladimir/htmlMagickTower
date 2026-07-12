// Canvas rendering, animation aging, HUD panels, and modal overlays.
(function registerPresentationUI(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerUi !== "function") {
    throw new Error("MagicTower.registerUi must load before js/ui/presentation.js");
  }

  /**
   * Installs the presentation API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installPresentation(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("presentation requires a GameContext with an api object.");
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
      TILES,
      MODES,
      ELEMENT_COLORS,
      ARTIFACT_RARITY_LABELS,
      ARTIFACT_RARITY_COLORS,
      SPELLS,
      MAX_SPELL_LEVEL,
      EVOLUTION_COST,
      ACTS,
      EVENT_TYPES,
    } = data;

    function cssClassToken(...args) {
      const implementation = context.api.cssClassToken;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function cssClassToken is not installed.");
      }
      return implementation(...args);
    }

    function clamp(...args) {
      const implementation = context.api.clamp;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function clamp is not installed.");
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

    function spellCost(...args) {
      const implementation = context.api.spellCost;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function spellCost is not installed.");
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

    function canEvolveSpell(...args) {
      const implementation = context.api.canEvolveSpell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function canEvolveSpell is not installed.");
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

    function getActForFloor(...args) {
      const implementation = context.api.getActForFloor;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function getActForFloor is not installed.");
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

    function isVisibleCell(...args) {
      const implementation = context.api.isVisibleCell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function isVisibleCell is not installed.");
      }
      return implementation(...args);
    }

    function isExploredCell(...args) {
      const implementation = context.api.isExploredCell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function isExploredCell is not installed.");
      }
      return implementation(...args);
    }

    function nearbySecretEntrance(...args) {
      const implementation = context.api.nearbySecretEntrance;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function nearbySecretEntrance is not installed.");
      }
      return implementation(...args);
    }

    function chooseBossRelic(...args) {
      const implementation = context.api.chooseBossRelic;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function chooseBossRelic is not installed.");
      }
      return implementation(...args);
    }

    function eventDefinition(...args) {
      const implementation = context.api.eventDefinition;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function eventDefinition is not installed.");
      }
      return implementation(...args);
    }

    function eventChoices(...args) {
      const implementation = context.api.eventChoices;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function eventChoices is not installed.");
      }
      return implementation(...args);
    }

    function chooseEventChoice(...args) {
      const implementation = context.api.chooseEventChoice;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function chooseEventChoice is not installed.");
      }
      return implementation(...args);
    }

    function chooseSecretReward(...args) {
      const implementation = context.api.chooseSecretReward;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function chooseSecretReward is not installed.");
      }
      return implementation(...args);
    }

    function addEffect(x, y, color, turns, label = "") {
      state.effects.push({ x, y, color, turns, label });
    }

    function render() {
      ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
      drawMap();
      drawHazards();
      drawBarriers();
      drawObjects();
      drawEnemies();
      drawPlayer();
      drawEffects();
    }

    function updateAnimationEffects() {
      state.effects.forEach((effect) => {
        effect.turns -= 1;
      });
      state.effects = state.effects.filter((effect) => effect.turns > 0);
    }

    function drawMap() {
      const size = CONFIG.tileSize;
      for (let y = 0; y < CONFIG.mapHeight; y += 1) {
        for (let x = 0; x < CONFIG.mapWidth; x += 1) {
          if (!isExploredCell(x, y)) {
            ctx.fillStyle = CONFIG.colors.fog;
            ctx.fillRect(x * size, y * size, size, size);
            continue;
          }

          const tile = state.map[y]?.[x] ?? TILES.WALL;
          if (tile === TILES.WALL) {
            ctx.fillStyle = (x + y) % 3 === 0 ? CONFIG.colors.wallDeep : CONFIG.colors.wall;
          } else if (tile === TILES.CORRIDOR) {
            ctx.fillStyle = CONFIG.colors.corridor;
          } else {
            ctx.fillStyle = (x + y) % 2 === 0 ? CONFIG.colors.floor : CONFIG.colors.floorAlt;
          }
          ctx.fillRect(x * size, y * size, size, size);
          ctx.strokeStyle = CONFIG.colors.grid;
          ctx.strokeRect(x * size + 0.5, y * size + 0.5, size, size);
          if (!isVisibleCell(x, y)) {
            ctx.fillStyle = CONFIG.colors.exploredFog;
            ctx.fillRect(x * size, y * size, size, size);
          }
        }
      }
    }

    function drawObjects() {
      state.objects.forEach((object) => {
        if (
          (object.type === EVENT_TYPES.CHEST || object.type === EVENT_TYPES.ALTAR || object.type === EVENT_TYPES.BOOK) &&
          object.used
        ) {
          return;
        }
        const visible = isVisibleCell(object.x, object.y);
        if (!isExploredCell(object.x, object.y)) {
          return;
        }
        const size = CONFIG.tileSize;
        const cx = object.x * size + size / 2;
        const cy = object.y * size + size / 2;
        if (object.type === EVENT_TYPES.TRAP && (!object.armed || !visible)) {
          return;
        }
        ctx.globalAlpha = visible ? 1 : 0.38;
        if (object.type === EVENT_TYPES.STAIRS) {
          drawGlyph(cx, cy, "⇧", CONFIG.colors.stairs, 18);
        } else if (object.type === EVENT_TYPES.BOOK) {
          const pulse = Math.sin(Date.now() / 180) * 2;
          ctx.fillStyle = CONFIG.colors.book;
          ctx.fillRect(object.x * size + 6, object.y * size + 4 + pulse, size - 12, size - 8);
          drawGlyph(cx, cy + pulse, "✦", "#fff1ff", 12);
        } else if (object.type === EVENT_TYPES.CHEST) {
          ctx.fillStyle = CONFIG.colors.chest;
          ctx.fillRect(object.x * size + 4, object.y * size + 8, size - 8, size - 9);
          ctx.fillStyle = "#f2cd76";
          ctx.fillRect(object.x * size + 9, object.y * size + 10, 4, 4);
        } else if (object.type === EVENT_TYPES.ALTAR) {
          drawGlyph(cx, cy, "◆", CONFIG.colors.altar, 15);
        } else if (object.type === EVENT_TYPES.TRAP) {
          drawGlyph(cx, cy, "×", CONFIG.colors.trap, 17);
        } else if (object.type === EVENT_TYPES.ARTIFACT) {
          const artifact = artifactById(object.artifactId);
          const rarity = artifact?.rarity || (artifact?.cursed ? "cursed" : "common");
          const color = ARTIFACT_RARITY_COLORS[rarity] || CONFIG.colors.artifact;
          drawGlyph(cx, cy, artifact?.cursed ? "✷" : "✧", color, 18);
        } else if (object.type === EVENT_TYPES.EVENT_ROOM) {
          const definition = eventDefinition(object);
          drawGlyph(cx, cy, definition?.mapLabel || "?", CONFIG.colors.eventRoom, 17);
        } else if (object.type === EVENT_TYPES.SECRET_ENTRANCE) {
          if (object.opened) {
            drawGlyph(cx, cy, "·", CONFIG.colors.secretRoom, 18);
          } else {
            const hintStrong = object.discovered || state.player?.revealsSecrets;
            ctx.strokeStyle = hintStrong ? CONFIG.colors.secretRoom : "rgba(158, 231, 255, 0.42)";
            ctx.lineWidth = hintStrong && visible ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(object.x * size + 7, object.y * size + 5);
            ctx.lineTo(object.x * size + 11, object.y * size + 10);
            ctx.lineTo(object.x * size + 9, object.y * size + 15);
            ctx.lineTo(object.x * size + 14, object.y * size + 19);
            ctx.stroke();
            ctx.lineWidth = 1;
            if (hintStrong) {
              drawGlyph(cx + 4, cy - 2, "∴", CONFIG.colors.secretRoom, 10);
            }
          }
        } else if (object.type === EVENT_TYPES.SECRET_ALTAR) {
          drawGlyph(cx, cy, object.used ? "◇" : "◆", object.used ? "#6b7f8c" : CONFIG.colors.secretRoom, 16);
        }
        ctx.globalAlpha = 1;

        if (
          visible &&
          state.player?.revealsSecrets &&
          [
            EVENT_TYPES.BOOK,
            EVENT_TYPES.CHEST,
            EVENT_TYPES.ARTIFACT,
            EVENT_TYPES.EVENT_ROOM,
            EVENT_TYPES.SECRET_ENTRANCE,
            EVENT_TYPES.SECRET_ALTAR,
          ].includes(object.type) &&
          distance(object, state.player) <= 7
        ) {
          ctx.strokeStyle = "#fff2a8";
          ctx.lineWidth = 2;
          ctx.strokeRect(object.x * size + 2, object.y * size + 2, size - 4, size - 4);
          ctx.lineWidth = 1;
        }
      });
    }

    function drawHazards() {
      const size = CONFIG.tileSize;
      state.hazards.forEach((hazard) => {
        for (let y = hazard.y - hazard.radius; y <= hazard.y + hazard.radius; y += 1) {
          for (let x = hazard.x - hazard.radius; x <= hazard.x + hazard.radius; x += 1) {
            if (!isInside(x, y) || distance({ x, y }, hazard) > hazard.radius) {
              continue;
            }
            if (!isVisibleCell(x, y)) {
              continue;
            }
            if (hazard.type === "danger") {
              ctx.fillStyle = "rgba(232, 78, 75, 0.58)";
            } else if (hazard.type === "fire") {
              ctx.fillStyle = "rgba(255, 112, 67, 0.38)";
            } else if (hazard.type === "acid") {
              ctx.fillStyle = "rgba(181, 231, 71, 0.36)";
            } else {
              ctx.fillStyle = CONFIG.colors.hazard;
            }
            ctx.fillRect(x * size + 3, y * size + 3, size - 6, size - 6);
            if (hazard.type === "danger") {
              ctx.strokeStyle = "#ffb1a8";
              ctx.lineWidth = 2;
              ctx.strokeRect(x * size + 4, y * size + 4, size - 8, size - 8);
              ctx.lineWidth = 1;
              drawGlyph(x * size + size / 2, y * size + size / 2, "!", "#fff2e8", 12);
            }
          }
        }
      });
    }

    function drawBarriers() {
      const size = CONFIG.tileSize;
      state.barriers.forEach((barrier) => {
        if (!isVisibleCell(barrier.x, barrier.y)) {
          return;
        }
        const x = barrier.x * size;
        const y = barrier.y * size;
        ctx.fillStyle = "rgba(180, 134, 91, 0.78)";
        ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        ctx.strokeStyle = "#efd0a7";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, y + 5, size - 10, size - 10);
        ctx.lineWidth = 1;
      });
    }

    function drawEnemies() {
      const size = CONFIG.tileSize;
      state.enemies.forEach((enemy) => {
        if (!isVisibleCell(enemy.x, enemy.y)) {
          return;
        }
        const cx = enemy.x * size + size / 2;
        const cy = enemy.y * size + size / 2;
        ctx.globalAlpha = enemy.illusion ? 0.55 : 1;
        ctx.fillStyle = enemy.color;
        if (enemy.boss) {
          ctx.fillRect(enemy.x * size + 3, enemy.y * size + 3, size - 6, size - 6);
          drawGlyph(cx, cy + 1, enemy.glyph, "#1a1410", 16);
        } else if (enemy.object) {
          drawGlyph(cx, cy, enemy.glyph, enemy.color, 18);
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
          ctx.fill();
          drawGlyph(cx, cy + 1, enemy.glyph, "#12151b", 13);
        }
        if (enemy.crystalShieldActive) {
          ctx.strokeStyle = "#e8fbff";
          ctx.lineWidth = 2;
          ctx.strokeRect(enemy.x * size + 4, enemy.y * size + 4, size - 8, size - 8);
          ctx.lineWidth = 1;
        }
        ctx.globalAlpha = 1;
        const barWidth = size - 4;
        ctx.fillStyle = "#151515";
        ctx.fillRect(enemy.x * size + 2, enemy.y * size + 1, barWidth, 3);
        ctx.fillStyle = "#e45c5c";
        ctx.fillRect(enemy.x * size + 2, enemy.y * size + 1, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 3);
      });
    }

    function drawPlayer() {
      if (!state.player) {
        return;
      }
      const size = CONFIG.tileSize;
      const cx = state.player.x * size + size / 2;
      const cy = state.player.y * size + size / 2;
      ctx.fillStyle = CONFIG.colors.player;
      ctx.fillRect(state.player.x * size + 5, state.player.y * size + 5, size - 10, size - 8);
      ctx.fillStyle = CONFIG.colors.playerTrim;
      ctx.fillRect(state.player.x * size + 8, state.player.y * size + 2, size - 16, 6);
      drawGlyph(cx, cy + 2, "M", "#fff", 13);
      if (state.player.shield > 0) {
        ctx.strokeStyle = ELEMENT_COLORS.earth;
        ctx.lineWidth = 2;
        ctx.strokeRect(state.player.x * size + 3, state.player.y * size + 3, size - 6, size - 6);
        ctx.lineWidth = 1;
      }
    }

    function drawEffects() {
      const size = CONFIG.tileSize;
      state.effects.forEach((effect) => {
        if (!isVisibleCell(effect.x, effect.y)) {
          return;
        }
        const alpha = clamp(effect.turns / 8, 0.15, 0.85);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = effect.color;
        ctx.fillRect(effect.x * size + 4, effect.y * size + 4, size - 8, size - 8);
        ctx.globalAlpha = 1;
        if (effect.label && effect.label.length <= 3) {
          drawGlyph(effect.x * size + size / 2, effect.y * size + size / 2, effect.label, "#ffffff", 11);
        }
      });
    }

    function drawGlyph(x, y, glyph, color, fontSize) {
      ctx.fillStyle = color;
      ctx.font = `700 ${fontSize}px "Segoe UI Symbol", "Arial", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyph, x, y);
    }

    function updateUI() {
      if (!state.player) {
        return;
      }
      const act = getActForFloor(state.floor);
      const actIndex = ACTS.indexOf(act);
      const actLabel = ["I", "II", "III"][actIndex] || String(actIndex + 1);
      dom.floorLabel.textContent = `Акт ${actLabel} · Этаж ${state.floor}`;
      dom.hpText.textContent = `${state.player.hp}/${state.player.maxHp}`;
      dom.hpFill.style.width = `${clamp((state.player.hp / state.player.maxHp) * 100, 0, 100)}%`;
      dom.manaText.textContent = `${state.player.mana}/${state.player.maxMana}`;
      dom.manaFill.style.width = `${clamp((state.player.mana / state.player.maxMana) * 100, 0, 100)}%`;
      dom.shieldText.textContent = `Щит: ${state.player.shield}`;
      if (dom.magicShardsText) {
        dom.magicShardsText.textContent = `Осколки: ${state.player.magicShards}`;
      }
      dom.turnText.textContent = `Ход ${state.turn}`;
      const trait = data.getTrait(state.player.traitId);
      dom.traitName.textContent = trait ? trait.name : "—";
      dom.traitEffect.textContent = trait ? trait.description : "—";
      updateArtifactList();
      updateSpellList();
      updateNearbyText();
      updateLog();
    }

    function updateSpellList() {
      dom.spellList.innerHTML = "";
      state.player.spells.forEach((spellId, index) => {
        const spell = SPELLS[spellId];
        const level = spellLevel(spellId);
        const upgrade = nextSpellUpgrade(spellId);
        const evolution = spellEvolution(spellId);
        const evolutions = evolutionOptions(spellId);
        const awaitingEvolution = state.evolutionChoiceSpellId === spellId;
        const upgradeShardCost = upgrade ? upgradeCost(upgrade) : 0;
        const evolutionShardCost = currentEvolutionCost();
        const upgradeDiscountText = upgrade && upgradeShardCost < upgrade.cost
          ? ` (Ключ: -${upgrade.cost - upgradeShardCost})`
          : "";
        const evolutionDiscountText = evolutionShardCost < EVOLUTION_COST
          ? ` (Ключ: -${EVOLUTION_COST - evolutionShardCost})`
          : "";
        const canUpgrade = Boolean(upgrade && state.player.magicShards >= upgradeShardCost);
        const canEvolve = canEvolveSpell(spellId);
        const upgradeInfo = upgrade
          ? `До ур. ${level + 1}: ${upgradeShardCost} осколок${upgradeDiscountText} - ${upgrade.text}`
          : evolution
            ? "Эволюция выбрана."
            : "Уровень 3 открыт для эволюции.";
        const evolutionInfo = evolution
          ? `<div class="spell-evolution is-chosen">Эволюция: <strong>${evolution.name}</strong> - ${evolution.description}</div>`
          : level >= MAX_SPELL_LEVEL && evolutions.length
            ? `<div class="spell-evolution">
                <div><strong>1. ${evolutions[0].name}</strong> - ${evolutions[0].description}</div>
                <div><strong>2. ${evolutions[1].name}</strong> - ${evolutions[1].description}</div>
                <span>Стоимость: ${evolutionShardCost} осколок${evolutionDiscountText}</span>
              </div>`
            : "";
        const statusText = upgrade
          ? canUpgrade
            ? state.upgradeMode ? `Нажмите ${index + 1}, чтобы улучшить` : "Можно улучшить"
            : "Не хватает осколков"
          : evolution
            ? "Ветка выбрана"
            : level >= MAX_SPELL_LEVEL && evolutions.length
              ? canEvolve
                ? awaitingEvolution
                  ? "1/2 - выбрать ветку, 3 - отмена"
                  : state.upgradeMode ? `Нажмите ${index + 1}, чтобы выбрать эволюцию` : "Можно эволюционировать"
                : `Нужен ${evolutionShardCost} осколок для эволюции`
              : "Максимальный уровень";
        const statusClass = evolution
          ? "is-evolved"
          : upgrade
            ? canUpgrade ? "is-ready" : "is-locked"
            : canEvolve || awaitingEvolution
              ? "is-ready"
              : level >= MAX_SPELL_LEVEL && evolutions.length ? "is-locked" : "is-max";
        const card = document.createElement("div");
        card.className = [
          "spell-card",
          index === state.selectedSpellIndex ? "is-active" : "",
          state.upgradeMode ? "is-upgrade-mode" : "",
          awaitingEvolution ? "is-evolution-choice" : "",
          canUpgrade || canEvolve ? "can-upgrade" : "",
          evolution ? "is-evolved" : "",
        ].filter(Boolean).join(" ");
        card.innerHTML = `
          <div class="spell-title">
            <span>${index + 1}. ${spell.name}</span>
            <span class="spell-badges">
              <span class="spell-level">Ур. ${level}/${MAX_SPELL_LEVEL}</span>
              <span style="color:${ELEMENT_COLORS[spell.element]}">${spellCost(spell)} м</span>
            </span>
          </div>
          <div class="spell-meta">${spell.description}</div>
          <div class="spell-upgrade">
            ${upgradeInfo}
          </div>
          ${evolutionInfo}
          <div class="spell-upgrade-status ${statusClass}">${statusText}</div>
        `;
        dom.spellList.appendChild(card);
      });

      for (let i = state.player.spells.length; i < 3; i += 1) {
        const card = document.createElement("div");
        card.className = "spell-card";
        card.innerHTML = `
          <div class="spell-title"><span>${i + 1}. Пустой слот</span><span>—</span></div>
          <div class="spell-meta">Найдите книгу заклинаний на первом этаже.</div>
        `;
        dom.spellList.appendChild(card);
      }
    }

    function updateArtifactList() {
      if (!dom.artifactList) {
        return;
      }
      dom.artifactList.innerHTML = "";

      const curses = state.player.curses || [];
      if (!state.player.artifacts.length && !curses.length) {
        const empty = document.createElement("div");
        empty.className = "artifact-empty";
        empty.textContent = "Артефактов пока нет.";
        dom.artifactList.appendChild(empty);
        return;
      }

      state.player.artifacts.forEach((ownedArtifact) => {
        const artifact = artifactById(ownedArtifact.definitionId || ownedArtifact.id);
        if (!artifact) {
          return;
        }
        const card = document.createElement("div");
        const rarity = artifact.rarity || (artifact.cursed ? "cursed" : "common");
        const isBossRelic = rarity === "bossRelic";
        const tier = artifact.tier || 1;
        const rarityLabel = ARTIFACT_RARITY_LABELS[rarity] || "Обычный";
        card.className = [
          "artifact-card",
          artifact.cursed ? "is-cursed" : "",
          ownedArtifact.active === false || ownedArtifact.spent ? "is-spent" : "",
          `rarity-${cssClassToken(rarity)}`,
          isBossRelic ? "" : `tier-${tier}`,
        ].filter(Boolean).join(" ");
        card.innerHTML = `
          <div class="artifact-title">
            <span>${artifact.name}</span>
            <strong>${isBossRelic ? rarityLabel : `${rarityLabel} · T${tier}`}</strong>
          </div>
          <div class="artifact-meta">${artifact.bonusText}</div>
          ${artifact.cursed ? `<div class="artifact-curse">${artifact.curseText}</div>` : ""}
          ${ownedArtifact.spent ? `<div class="artifact-state">Неактивен: сила артефакта израсходована.</div>` : ""}
        `;
        dom.artifactList.appendChild(card);
      });

      curses.forEach((curse, index) => {
        const card = document.createElement("div");
        card.className = "artifact-card is-cursed rarity-cursed";
        card.innerHTML = `
          <div class="artifact-title">
            <span>Проклятие: ${curse.name}</span>
            <strong>Слабое · ${index + 1}</strong>
          </div>
          <div class="artifact-meta">${curse.description}</div>
          <div class="artifact-state">Фонтан маны может очистить одно слабое проклятие.</div>
        `;
        dom.artifactList.appendChild(card);
      });
    }

    function updateNearbyText() {
      const nearbyObjects = state.objects
        .filter((object) => distance(object, state.player) <= 1 && object.type !== EVENT_TYPES.TRAP)
        .map((object) => {
          if (object.type === EVENT_TYPES.BOOK) return `Книга: ${SPELLS[object.spellId].name}`;
          if (object.type === EVENT_TYPES.STAIRS) return "Лестница наверх";
          if (object.type === EVENT_TYPES.CHEST) return object.used ? "Пустой сундук" : "Сундук с маной";
          if (object.type === EVENT_TYPES.ALTAR) return object.used ? "Погасший алтарь" : "Алтарь лечения";
          if (object.type === EVENT_TYPES.ARTIFACT) {
            const artifact = artifactById(object.artifactId);
            if (!artifact) return "Неизвестный артефакт";
            return artifact.cursed
              ? `Проклятый артефакт: ${artifact.name}. ${artifact.bonusText} Проклятие скрыто`
              : `Артефакт: ${artifact.name}. ${artifact.bonusText}`;
          }
          if (object.type === EVENT_TYPES.EVENT_ROOM) {
            const definition = eventDefinition(object);
            return definition ? `${definition.name}: ${definition.description}` : "Комната-событие";
          }
          if (object.type === EVENT_TYPES.SECRET_ENTRANCE) {
            return object.opened
              ? "Открытый тайный проход"
              : "Подозрительная стена: трещина складывается в слабую руну";
          }
          if (object.type === EVENT_TYPES.SECRET_ALTAR) {
            return object.used
              ? "Погасший забытый алтарь архимага"
              : "Забытый алтарь архимага: можно выбрать одну редкую награду";
          }
          return "Неизвестный объект";
        });
      const secretHint = nearbySecretEntrance()
        ? "Где-то рядом камень звучит пусто. Присмотритесь к стенам."
        : "";
      dom.nearbyText.textContent = nearbyObjects.length
        ? `${nearbyObjects.join(". ")}. Нажмите E.`
        : secretHint || "Рядом пока ничего нет.";
    }

    function updateLog() {
      dom.eventLog.innerHTML = "";
      state.logs.forEach((message) => {
        const item = document.createElement("li");
        item.textContent = message;
        dom.eventLog.appendChild(item);
      });
      dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
    }

    function renderBossRelicChoices() {
      if (!dom.bossRelicChoice) {
        return;
      }
      dom.bossRelicChoice.innerHTML = "";
      state.pendingBossRelicChoices.forEach((relicId, index) => {
        const relic = artifactById(relicId);
        if (!relic) {
          return;
        }
        const card = document.createElement("button");
        card.type = "button";
        card.className = "relic-choice-card";
        card.innerHTML = `
          <span class="relic-choice-hotkey">${index + 1}</span>
          <span class="relic-choice-rarity">${ARTIFACT_RARITY_LABELS[relic.rarity] || "Босс-реликвия"}</span>
          <strong>${relic.name}</strong>
          <span class="relic-choice-effect">${relic.bonusText}</span>
        `;
        card.addEventListener("click", () => chooseBossRelic(index));
        dom.bossRelicChoice.appendChild(card);
      });
    }

    function renderEventChoices() {
      if (!dom.bossRelicChoice) {
        return;
      }
      dom.bossRelicChoice.innerHTML = "";
      eventChoices(state.pendingEvent).forEach((choice, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.disabled = Boolean(choice.disabled);
        card.className = [
          "relic-choice-card",
          "event-choice-card",
          choice.disabled ? "is-disabled" : "",
        ].filter(Boolean).join(" ");
        card.innerHTML = `
          <span class="relic-choice-hotkey">${index + 1}</span>
          <span class="relic-choice-rarity">${choice.disabled ? "Недоступно" : "Выбор"}</span>
          <strong>${choice.title}</strong>
          <span class="relic-choice-effect">${choice.effect}</span>
          ${choice.disabled ? `<span class="relic-choice-disabled">${choice.disabledReason}</span>` : ""}
        `;
        card.addEventListener("click", () => chooseEventChoice(index));
        dom.bossRelicChoice.appendChild(card);
      });
    }

    function renderSecretRewardChoices() {
      if (!dom.bossRelicChoice) {
        return;
      }
      dom.bossRelicChoice.innerHTML = "";
      state.pendingSecretRewardChoices.forEach((choiceId, index) => {
        const choice = data.getSecretReward(choiceId);
        if (!choice) {
          return;
        }
        const card = document.createElement("button");
        card.type = "button";
        card.className = [
          "relic-choice-card",
          "secret-choice-card",
          choice.rarity === "secret" ? "is-secret" : "",
        ].filter(Boolean).join(" ");
        card.innerHTML = `
          <span class="relic-choice-hotkey">${index + 1}</span>
          <span class="relic-choice-rarity">${choice.rarity === "secret" ? "Секрет" : "Награда"}</span>
          <strong>${choice.title}</strong>
          <span class="relic-choice-effect">${choice.effect}</span>
        `;
        card.addEventListener("click", () => chooseSecretReward(index));
        dom.bossRelicChoice.appendChild(card);
      });
    }

    function updateOverlay() {
      const isRelicChoice = state.mode === MODES.RELIC_CHOICE;
      const isEventChoice = state.mode === MODES.EVENT_CHOICE;
      const isSecretRewardChoice = state.mode === MODES.SECRET_REWARD_CHOICE;
      const isChoicePanel = isRelicChoice || isEventChoice || isSecretRewardChoice;
      dom.overlay.classList.toggle("is-visible", state.mode !== MODES.PLAYING);
      dom.overlayContent?.classList.toggle("is-relic-choice", isChoicePanel);
      if (dom.bossRelicChoice) {
        dom.bossRelicChoice.hidden = !isChoicePanel;
        if (!isChoicePanel) {
          dom.bossRelicChoice.innerHTML = "";
        }
      }
      dom.primaryAction.style.display = isChoicePanel ? "none" : "";

      if (state.mode === MODES.MENU) {
        dom.overlayKicker.textContent = "Древняя башня ждет";
        dom.overlayTitle.textContent = "Башня последнего мага";
        dom.overlayText.textContent =
          "Пройдите 15 этажей трех актов, соберите заклинания и артефакты, а затем победите Сердце башни. Каменный архиголем и Зеркальный архимаг ждут на 5 и 10 этажах.";
        dom.primaryAction.textContent = "Начать восхождение";
      } else if (isRelicChoice) {
        dom.overlayKicker.textContent = `Босс повержен · этаж ${state.pendingBossRelicFloor}`;
        dom.overlayTitle.textContent = "Выберите босс-реликвию";
        dom.overlayText.textContent = "Возьмите одну универсальную реликвию. Башня продолжит движение только после выбора.";
        renderBossRelicChoices();
      } else if (isEventChoice) {
        const definition = eventDefinition(state.pendingEvent);
        dom.overlayKicker.textContent = `Событие · этаж ${state.floor}`;
        dom.overlayTitle.textContent = definition?.name || "Комната-событие";
        dom.overlayText.textContent = definition?.description || "Башня предлагает выбор.";
        renderEventChoices();
      } else if (isSecretRewardChoice) {
        dom.overlayKicker.textContent = `Секрет · этаж ${state.floor}`;
        dom.overlayTitle.textContent = "Забытый алтарь архимага";
        dom.overlayText.textContent = "Древний алтарь предлагает одну редкую награду. После выбора его сила погаснет.";
        renderSecretRewardChoices();
      } else if (state.mode === MODES.VICTORY) {
        dom.overlayKicker.textContent = "Победа";
        dom.overlayTitle.textContent = "Башня спасена";
        dom.overlayText.textContent =
          "Сердце башни пало, древняя магия стихла. Нажмите R или кнопку, чтобы начать новый забег.";
        dom.primaryAction.textContent = "Новая игра";
      } else if (state.mode === MODES.GAME_OVER) {
        dom.overlayKicker.textContent = "Поражение";
        dom.overlayTitle.textContent = "Маг пал в башне";
        dom.overlayText.textContent =
          "Башня оказалась сильнее на этот раз. Нажмите R или кнопку, чтобы попробовать другой билд с чистого начала.";
        dom.primaryAction.textContent = "Попробовать снова";
      }
    }

    const localApi = {
      addEffect,
      render,
      drawMap,
      drawObjects,
      drawHazards,
      drawBarriers,
      drawEnemies,
      drawPlayer,
      drawEffects,
      drawGlyph,
      updateUI,
      updateSpellList,
      updateArtifactList,
      updateNearbyText,
      updateLog,
      renderBossRelicChoices,
      renderEventChoices,
      renderSecretRewardChoices,
      updateOverlay,
      updateAnimationEffects,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerUi("presentation", installPresentation);
})(globalThis);
