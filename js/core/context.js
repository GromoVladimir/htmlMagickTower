(function registerRuntimeContext(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerRuntime !== "function") {
    throw new Error("MagicTower namespace must load before js/core/context.js.");
  }

  /**
   * @typedef {Object} RuntimeEnemy
   * @property {number} id
   * @property {string} definitionId
   * @property {string} type
   * @property {number} x
   * @property {number} y
   * @property {number} hp
   * @property {number} maxHp
   * @property {number} damage
   * @property {number} slow
   * @property {number} stun
   * @property {number} burn
   */

  /**
   * @typedef {Object} WorldObject
   * @property {number} id
   * @property {string} type
   * @property {number} x
   * @property {number} y
   * @property {string=} definitionId
   * @property {Object=} payload
   */

  /**
   * @typedef {Object} OwnedArtifact
   * @property {string} definitionId
   * @property {boolean} active
   * @property {boolean} spent
   */

  /**
   * @typedef {Object} GameContext
   * @property {Object} state Shared mutable game state.
   * @property {Object} data Flat immutable content catalog.
   * @property {Object} catalogs Immutable category catalogs.
   * @property {Object} behaviors Behavior registries.
   * @property {Object} api Late-bound domain-system facade.
   * @property {Object} dom Browser DOM references.
   * @property {CanvasRenderingContext2D|Object} canvasContext Canvas adapter.
   * @property {{next: () => number}} rng Random source; production delegates to Math.random.
   * @property {{next: () => number}} ids Runtime ID source backed by state.idCounter.
   */

  /**
   * Creates a fresh state graph. Nested collections are never shared between runs.
   *
   * @param {Object} modes
   * @returns {Object}
   */
  function createInitialState(modes) {
    return {
      mode: modes.MENU,
      floor: 1,
      map: [],
      rooms: [],
      player: null,
      enemies: [],
      objects: [],
      hazards: [],
      barriers: [],
      effects: [],
      visible: [],
      explored: [],
      logs: [],
      turn: 0,
      selectedSpellIndex: 0,
      upgradeMode: false,
      evolutionChoiceSpellId: null,
      evolutionChoiceSlotIndex: null,
      pendingManaRefund: 0,
      currentSpellDamageBonus: 0,
      pendingBossRelicChoices: [],
      pendingBossRelicExit: null,
      pendingBossRelicFloor: null,
      pendingEvent: null,
      pendingSecretRewardChoices: [],
      pendingSecretAltarId: null,
      secretRoomDiscovered: false,
      secretRoomOpened: false,
      secretRewardClaimed: false,
      secretEntranceId: null,
      activeChallenge: null,
      idCounter: 1,
      lastMoveDir: { x: 1, y: 0 },
    };
  }

  /**
   * @param {{dom: Object, canvasContext: Object, data: Object, random?: () => number}} options
   * @returns {GameContext}
   */
  function createGameContext(options) {
    if (!options || !options.data || !options.data.MODES) {
      throw new TypeError("createGameContext requires the flat content catalog.");
    }

    const random = options.random || Math.random;
    if (typeof random !== "function") {
      throw new TypeError("GameContext random source must be a function.");
    }

    const state = createInitialState(options.data.MODES);
    const context = {
      state,
      dom: options.dom || Object.create(null),
      canvasContext: options.canvasContext || Object.create(null),
      data: options.data,
      catalogs: MT.data,
      behaviors: MT.behaviors,
      api: Object.create(null),
      rng: {
        next() {
          return random();
        },
      },
      ids: {
        next() {
          state.idCounter += 1;
          return state.idCounter;
        },
      },
    };
    return context;
  }

  MT.registerRuntime("context", {
    createInitialState,
    createGameContext,
  });
})(globalThis);
