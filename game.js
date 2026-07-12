(function bootstrapMagicTower(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower?.data?.catalog || !MagicTower?.runtime?.context) {
    throw new Error("MagicTower catalogs and runtime context must load before game.js.");
  }

  const dom = {
    canvas: document.getElementById("gameCanvas"),
    floorLabel: document.getElementById("floorLabel"),
    hpText: document.getElementById("hpText"),
    hpFill: document.getElementById("hpFill"),
    manaText: document.getElementById("manaText"),
    manaFill: document.getElementById("manaFill"),
    shieldText: document.getElementById("shieldText"),
    magicShardsText: document.getElementById("magicShardsText"),
    turnText: document.getElementById("turnText"),
    traitName: document.getElementById("traitName"),
    traitEffect: document.getElementById("traitEffect"),
    artifactList: document.getElementById("artifactList"),
    spellList: document.getElementById("spellList"),
    nearbyText: document.getElementById("nearbyText"),
    eventLog: document.getElementById("eventLog"),
    overlay: document.getElementById("screenOverlay"),
    overlayContent: document.getElementById("overlayContent"),
    overlayKicker: document.getElementById("overlayKicker"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayText: document.getElementById("overlayText"),
    bossRelicChoice: document.getElementById("bossRelicChoice"),
    primaryAction: document.getElementById("primaryAction"),
  };

  const missingElement = Object.entries(dom).find(([, element]) => !element);
  if (missingElement) {
    throw new Error(`Missing required game element: ${missingElement[0]}.`);
  }

  const canvasContext = dom.canvas.getContext("2d");
  if (!canvasContext) {
    throw new Error("The game canvas does not provide a 2D context.");
  }
  canvasContext.imageSmoothingEnabled = false;

  /** @type {GameContext} */
  const context = MagicTower.runtime.context.createGameContext({
    dom,
    canvasContext,
    data: MagicTower.data.catalog,
  });

  const systemOrder = [
    "core",
    "world",
    "progression",
    "events",
    "spells",
    "combat",
    "enemyAi",
    "bossAi",
  ];
  systemOrder.forEach((name) => {
    const install = MagicTower.systems[name];
    if (typeof install !== "function") {
      throw new Error(`Missing MagicTower system installer: ${name}.`);
    }
    install(context);
  });

  ["input", "presentation"].forEach((name) => {
    const install = MagicTower.ui[name];
    if (typeof install !== "function") {
      throw new Error(`Missing MagicTower UI installer: ${name}.`);
    }
    install(context);
  });

  const { api, state } = context;
  const { MODES } = context.data;

  function newGame() {
    return api.newGame();
  }

  function startFloor(floor) {
    return api.startFloor(floor);
  }

  function dispatchKey(key, code = key) {
    return api.handleKeyDown({
      key,
      code,
      preventDefault() {},
    });
  }

  function renderFrame() {
    api.render();
    api.updateAnimationEffects();
    requestAnimationFrame(renderFrame);
  }

  MagicTower.registerRuntime("game", Object.freeze({
    context,
    newGame,
    startFloor,
    dispatchKey,
    getState: () => state,
  }));

  dom.primaryAction.addEventListener("click", () => {
    if ([MODES.MENU, MODES.VICTORY, MODES.GAME_OVER].includes(state.mode)) {
      newGame();
    }
  });
  document.addEventListener("keydown", api.handleKeyDown);

  state.map = api.createEmptyMap();
  api.updateOverlay();
  renderFrame();
})(globalThis);
