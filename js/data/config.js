(function registerConfig(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerData !== "function") {
    throw new Error("MagicTower namespace must be loaded before data catalogs.");
  }

  const CONFIG = {
    mapWidth: 40,
    mapHeight: 25,
    tileSize: 22,
    maxFloors: 15,
    logLimit: 9,
    roomAttempts: 130,
    manaRegenEvery: 4,
    eventRoomChance: 0.35,
    secretRoom: {
      floorChance: 0.75,
      floorRange: [6, 12],
      excludedFloors: [5, 10, 15],
      hintRadius: 6,
    },
    basePlayer: {
      hp: 10,
      maxHp: 10,
      mana: 8,
      maxMana: 8,
      staffDamage: 1,
    },
    colors: {
      wall: "#1c222b",
      wallDeep: "#11161e",
      floor: "#343f4f",
      floorAlt: "#2e3847",
      corridor: "#2b3442",
      grid: "rgba(255,255,255,0.035)",
      player: "#8e78ff",
      playerTrim: "#56d8ff",
      stairs: "#d4c27a",
      book: "#d05cff",
      chest: "#c58b3b",
      altar: "#64c7ff",
      trap: "#a73840",
      hazard: "rgba(111, 224, 88, 0.38)",
      artifact: "#f4d35e",
      cursedArtifact: "#d65cff",
      eventRoom: "#82e6c8",
      secretRoom: "#9ee7ff",
      fog: "#020309",
      exploredFog: "rgba(2, 3, 9, 0.68)",
    },
  };

  const TILES = {
    WALL: 0,
    FLOOR: 1,
    CORRIDOR: 2,
  };

  const MODES = {
    MENU: "menu",
    PLAYING: "playing",
    RELIC_CHOICE: "relicChoice",
    EVENT_CHOICE: "eventChoice",
    SECRET_REWARD_CHOICE: "secretRewardChoice",
    VICTORY: "victory",
    GAME_OVER: "gameOver",
  };

  const ELEMENT_COLORS = {
    fire: "#ff7043",
    ice: "#70d6ff",
    poison: "#73d13d",
    lightning: "#ffe86a",
    light: "#fff2a8",
    shadow: "#b46bff",
    earth: "#b4865b",
    wind: "#64e6db",
    arcane: "#9a8cff",
  };

  const ELEMENT_NAMES = {
    fire: "огню",
    ice: "льду",
    poison: "яду",
    lightning: "молнии",
    light: "свету",
    shadow: "тьме",
    earth: "земле",
    wind: "ветру",
    arcane: "магии",
  };

  const ARTIFACT_RARITY_LABELS = {
    common: "Обычный",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный",
    secret: "Секретный",
    cursed: "Проклятый",
    bossRelic: "Босс-реликвия",
  };

  const ARTIFACT_RARITY_COLORS = {
    common: "#cfd7e4",
    rare: "#8fc7ff",
    epic: "#c59cff",
    legendary: "#ffd66d",
    secret: "#bff4ff",
    cursed: "#ff95de",
    bossRelic: "#ff9ab0",
  };

  const MAX_SPELL_LEVEL = 3;

  const SPELL_UPGRADE_COST = 1;

  const EVOLUTION_COST = 1;

  const ENEMY_SCALING = {
    hpPerFloor: 0.65,
    damagePerFloor: 0.75,
    defaultDamageScaleEvery: 5,
  };

  MT.registerData("config", {
    CONFIG,
    TILES,
    MODES,
    ELEMENT_COLORS,
    ELEMENT_NAMES,
    ARTIFACT_RARITY_LABELS,
    ARTIFACT_RARITY_COLORS,
    MAX_SPELL_LEVEL,
    SPELL_UPGRADE_COST,
    EVOLUTION_COST,
    ENEMY_SCALING,
  });
})(globalThis);
