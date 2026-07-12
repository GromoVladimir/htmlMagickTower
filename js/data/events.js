(function registerEvents(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerData !== "function") {
    throw new Error("MagicTower namespace must be loaded before data catalogs.");
  }

  const EVENT_TYPES = {
    STAIRS: "stairs",
    BOOK: "book",
    CHEST: "chest",
    ALTAR: "altar",
    TRAP: "trap",
    ARTIFACT: "artifact",
    EVENT_ROOM: "eventRoom",
    SECRET_ENTRANCE: "secretEntrance",
    SECRET_ALTAR: "secretAltar",
  };

  const WORLD_OBJECT_TYPES = {
    stairs: { rendererId: "stairs", interactionId: "stairs" },
    book: { rendererId: "book", interactionId: "book" },
    chest: { rendererId: "chest", interactionId: "chest" },
    altar: { rendererId: "altar", interactionId: "altar" },
    trap: { rendererId: "trap", interactionId: "trap" },
    artifact: { rendererId: "artifact", interactionId: "artifact" },
    eventRoom: { rendererId: "eventRoom", interactionId: "eventRoom" },
    secretEntrance: { rendererId: "secretEntrance", interactionId: "secretEntrance" },
    secretAltar: { rendererId: "secretAltar", interactionId: "secretAltar" },
  };

  const EVENT_ROOM_DEFINITIONS = {
    mirrorLibrary: {
      id: "mirrorLibrary",
      behaviorId: "mirrorLibrary",
      name: "Зеркальная библиотека",
      mapLabel: "Б",
      description: "Страницы отражают возможные версии мага. Можно взять силу, знание или рискнуть текущей школой.",
    },
    cursedAltar: {
      id: "cursedAltar",
      behaviorId: "cursedAltar",
      name: "Проклятый алтарь",
      mapLabel: "А",
      description: "Алтарь предлагает артефакт, но просит плату здоровьем или слабым проклятием.",
    },
    manaFountain: {
      id: "manaFountain",
      behaviorId: "manaFountain",
      name: "Фонтан маны",
      mapLabel: "Ф",
      description: "Чистая мана бьет из трещин камня. Она может восстановить силы или смыть слабое проклятие.",
    },
    trialRoom: {
      id: "trialRoom",
      behaviorId: "trialRoom",
      name: "Комната испытания",
      mapLabel: "И",
      description: "Башня предлагает короткую схватку. Врагов будет ровно двое, а награда известна заранее.",
    },
  };

  const WEAK_CURSE_TYPES = {
    manaCrack: {
      id: "manaCrack",
      name: "Трещина маны",
      description: "-1 к максимальной мане.",
    },
  };

  const SECRET_HINT_MESSAGES = [
    "Где-то поблизости камни звучат пусто.",
    "На стенах проступают едва заметные руны.",
    "Ты чувствуешь сквозняк там, где его не должно быть.",
  ];

  const SECRET_REWARD_DEFINITIONS = [
    {
      id: "forgottenArchmageKey",
      behaviorId: "forgottenArchmageKey",
      title: "Ключ забытого архимага",
      rarity: "secret",
      effect: "+1 осколок магии, полная мана, следующее улучшение или эволюция дешевле на 1 осколок.",
    },
    {
      id: "pureMagicShard",
      behaviorId: "pureMagicShard",
      title: "Осколок чистой магии",
      rarity: "reward",
      effect: "+1 осколок магии.",
    },
    {
      id: "masteryRune",
      behaviorId: "masteryRune",
      title: "Руна мастерства",
      rarity: "reward",
      effect: "Бесплатно улучшает выбранное известное заклинание на 1 уровень, если это возможно.",
    },
    {
      id: "lifeSpring",
      behaviorId: "lifeSpring",
      title: "Источник жизни",
      rarity: "reward",
      effect: "Полностью восстанавливает здоровье и ману. +1 к максимальному здоровью.",
    },
    {
      id: "cleansingSeal",
      behaviorId: "cleansingSeal",
      title: "Печать очищения",
      rarity: "reward",
      effect: "Снимает одно слабое проклятие. Если проклятий нет, дает +1 к максимальной мане.",
    },
    {
      id: "secretArtifact",
      behaviorId: "secretArtifact",
      title: "Тайный артефакт",
      rarity: "reward",
      effect: "Случайный эпический или легендарный артефакт текущего акта.",
    },
  ];

  MT.registerData("events", {
    EVENT_TYPES,
    WORLD_OBJECT_TYPES,
    EVENT_ROOM_DEFINITIONS,
    WEAK_CURSE_TYPES,
    SECRET_HINT_MESSAGES,
    SECRET_REWARD_DEFINITIONS,
  });
})(globalThis);
