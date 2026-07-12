// Keyboard normalization and command routing.
(function registerInputUI(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerUi !== "function") {
    throw new Error("MagicTower.registerUi must load before js/ui/input.js");
  }

  /**
   * Installs the input API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installInput(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("input requires a GameContext with an api object.");
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
    } = data;

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

    function newGame(...args) {
      const implementation = context.api.newGame;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function newGame is not installed.");
      }
      return implementation(...args);
    }

    function toggleUpgradeMode(...args) {
      const implementation = context.api.toggleUpgradeMode;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function toggleUpgradeMode is not installed.");
      }
      return implementation(...args);
    }

    function upgradeSpellInSlot(...args) {
      const implementation = context.api.upgradeSpellInSlot;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function upgradeSpellInSlot is not installed.");
      }
      return implementation(...args);
    }

    function chooseEvolutionBranch(...args) {
      const implementation = context.api.chooseEvolutionBranch;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function chooseEvolutionBranch is not installed.");
      }
      return implementation(...args);
    }

    function tryMovePlayer(...args) {
      const implementation = context.api.tryMovePlayer;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function tryMovePlayer is not installed.");
      }
      return implementation(...args);
    }

    function interact(...args) {
      const implementation = context.api.interact;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function interact is not installed.");
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

    function cancelEventChoice(...args) {
      const implementation = context.api.cancelEventChoice;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function cancelEventChoice is not installed.");
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

    function cancelSecretRewardChoice(...args) {
      const implementation = context.api.cancelSecretRewardChoice;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function cancelSecretRewardChoice is not installed.");
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

    function castSelectedSpell(...args) {
      const implementation = context.api.castSelectedSpell;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function castSelectedSpell is not installed.");
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

    function handleKeyDown(event) {
      const key = normalizeKey(event.key.toLowerCase(), event.code);

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "enter"].includes(key)) {
        event.preventDefault();
      }

      if (state.mode === MODES.MENU) {
        if (key === "enter" || key === " ") {
          newGame();
        }
        return;
      }

      if (state.mode === MODES.VICTORY || state.mode === MODES.GAME_OVER) {
        if (key === "r" || key === "enter" || key === " ") {
          newGame();
        }
        return;
      }

      if (state.mode === MODES.RELIC_CHOICE) {
        if (["1", "2", "3"].includes(key)) {
          chooseBossRelic(Number(key) - 1);
        }
        return;
      }

      if (state.mode === MODES.EVENT_CHOICE) {
        if (["1", "2", "3"].includes(key)) {
          chooseEventChoice(Number(key) - 1);
        } else if (key === "escape") {
          cancelEventChoice();
        }
        return;
      }

      if (state.mode === MODES.SECRET_REWARD_CHOICE) {
        if (["1", "2", "3"].includes(key)) {
          chooseSecretReward(Number(key) - 1);
        } else if (key === "escape") {
          cancelSecretRewardChoice();
        }
        return;
      }

      if (key === "escape") {
        setMode(MODES.MENU);
        return;
      }

      if (state.mode !== MODES.PLAYING) {
        return;
      }

      if (key === "u") {
        toggleUpgradeMode();
        return;
      }

      const dir = keyToDirection(key);
      if (dir) {
        tryMovePlayer(dir.x, dir.y);
        return;
      }

      if (["1", "2", "3"].includes(key)) {
        const index = Number(key) - 1;
        if (state.upgradeMode) {
          if (state.evolutionChoiceSpellId) {
            chooseEvolutionBranch(index);
            return;
          }
          upgradeSpellInSlot(index);
          return;
        }
        if (state.player.spells[index]) {
          state.selectedSpellIndex = index;
          addLog(`Выбрано: ${SPELLS[state.player.spells[index]].name}.`);
        }
        updateUI();
        return;
      }

      if (key === " " || key === "enter") {
        castSelectedSpell();
        return;
      }

      if (key === "e") {
        interact();
      }
    }

    function normalizeKey(key, code) {
      const physicalKeys = {
        KeyW: "w",
        KeyA: "a",
        KeyS: "s",
        KeyD: "d",
        KeyE: "e",
        KeyR: "r",
        KeyU: "u",
      };
      const russianLayout = {
        ц: "w",
        ф: "a",
        ы: "s",
        в: "d",
        у: "e",
        к: "r",
        г: "u",
      };
      return russianLayout[key] || physicalKeys[code] || key;
    }

    function keyToDirection(key) {
      if (key === "w" || key === "arrowup") return { x: 0, y: -1 };
      if (key === "s" || key === "arrowdown") return { x: 0, y: 1 };
      if (key === "a" || key === "arrowleft") return { x: -1, y: 0 };
      if (key === "d" || key === "arrowright") return { x: 1, y: 0 };
      return null;
    }

    const localApi = {
      handleKeyDown,
      normalizeKey,
      keyToDirection,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerUi("input", installInput);
})(globalThis);
