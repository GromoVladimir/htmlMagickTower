(function registerBosses(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerData !== "function") {
    throw new Error("MagicTower namespace must be loaded before data catalogs.");
  }

  const BOSS_TYPES = {
    stoneArchgolem: {
      id: "stoneArchgolem",
      behaviorId: "stoneArchgolem",
      name: "Каменный архиголем",
      glyph: "A",
      color: "#c0a46b",
      hp: 22,
      damage: 3,
      speed: 1,
      range: 1,
      boss: true,
      weakTo: ["ice", "light"],
      attackText: "Каменный архиголем обрушивает тяжелый кулак.",
    },
    mirrorArchmage: {
      id: "mirrorArchmage",
      behaviorId: "mirrorArchmage",
      name: "Зеркальный архимаг",
      glyph: "M",
      color: "#9bdcff",
      hp: 28,
      damage: 3,
      speed: 1,
      range: 5,
      ranged: true,
      boss: true,
      weakTo: ["shadow", "lightning"],
      attackText: "Зеркальный архимаг выпускает преломленный луч.",
    },
    towerAvatar: {
      id: "towerAvatar",
      behaviorId: "towerAvatar",
      name: "Сердце башни / Аватар башни",
      glyph: "T",
      color: "#ff6f9f",
      hp: 38,
      damage: 4,
      speed: 1,
      range: 4,
      ranged: true,
      boss: true,
      weakTo: ["light", "arcane"],
      attackText: "Аватар башни сжимает пространство вокруг мага.",
    },
  };

  const BOSSES_BY_FLOOR = {
    5: "stoneArchgolem",
    10: "mirrorArchmage",
    15: "towerAvatar",
  };

  const BOSS_RULES = {
    stoneArchgolem: {
      specialEvery: 4,
      maxSmallGolems: 2,
      summonChance: 0.55,
      runeTurns: 4,
      attackBoost: 1,
      minSummonDistanceFromPlayer: 2,
    },
    mirrorArchmage: {
      specialEvery: 4,
      maxIllusions: 1,
      illusionTurns: 4,
      attackBoost: 1,
      resistTurns: 4,
      resistReduction: 0.5,
      minResistedDamage: 1,
      minSummonDistanceFromPlayer: 2,
    },
    towerAvatar: {
      specialEvery: 3,
      phase3Every: 2,
      phase2Threshold: 0.66,
      phase3Threshold: 0.33,
      maxShards: 1,
      shardCooldown: 6,
      shardDamageBonus: 1,
      shardPulseEvery: 3,
      shardHp: 5,
      hazardTurns: 3,
      attackBoost: 1,
      minShardDistanceFromPlayer: 2,
    },
  };

  const BOSS_ALIASES = {
    boss: "stoneArchgolem",
  };

  function resolveBossId(id) {
    return BOSS_ALIASES[id] || id;
  }

  function getBossDefinition(id) {
    return BOSS_TYPES[resolveBossId(id)] || null;
  }

  Object.defineProperty(BOSS_TYPES, "boss", {
    value: BOSS_TYPES.stoneArchgolem,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  MT.registerData("bosses", {
    BOSS_TYPES,
    BOSS_ALIASES,
    BOSSES_BY_FLOOR,
    BOSS_RULES,
    resolveBossId,
    getBossDefinition,
  });
})(globalThis);
