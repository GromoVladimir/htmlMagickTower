(function registerTraitCatalog(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerData !== "function") {
    throw new Error("MagicTower.registerData must be loaded before js/data/traits.js");
  }

  /**
   * @typedef {Object} EffectDescriptor
   * @property {"property"|"changeMaxHp"|"changeMaxMana"|"capAt"} type
   * @property {string} [target]
   * @property {"add"|"max"|"set"} [operation]
   * @property {*} [value]
   * @property {string} [valueFrom]
   * @property {number} [amount]
   * @property {string} [maxTarget]
   */

  /**
   * @typedef {Object} TraitDefinition
   * @property {string} id
   * @property {string} name
   * @property {"universal"|"elemental"} type
   * @property {string} [element]
   * @property {string} description
   * @property {EffectDescriptor[]} onAcquire
   */

  /** @type {TraitDefinition[]} */
  const TRAITS = [
    {
      id: "deepReserve",
      name: "Глубокий резерв",
      type: "universal",
      description: "+4 к максимальной мане.",
      onAcquire: [
        { type: "changeMaxMana", amount: 4 },
      ],
    },
    {
      id: "battleMage",
      name: "Ученик боевого мага",
      type: "universal",
      description: "+1 к урону всех заклинаний.",
      onAcquire: [
        { type: "property", target: "flatSpellBonus", operation: "add", value: 1 },
      ],
    },
    {
      id: "fastFocus",
      name: "Быстрая концентрация",
      type: "universal",
      description: "Мана восстанавливается чаще.",
      onAcquire: [
        { type: "property", target: "manaRegenEvery", operation: "set", value: 3 },
      ],
    },
    {
      id: "carefulExplorer",
      name: "Осторожный исследователь",
      type: "universal",
      description: "Первый полученный урон на каждом этаже блокируется.",
      onAcquire: [
        { type: "property", target: "blocksFirstHit", operation: "set", value: true },
      ],
    },
    {
      id: "secretSeeker",
      name: "Искатель тайн",
      type: "universal",
      description: "Книги и сундуки подсвечиваются рядом.",
      onAcquire: [
        { type: "property", target: "revealsSecrets", operation: "set", value: true },
      ],
    },
    {
      id: "sturdy",
      name: "Живучий",
      type: "universal",
      description: "+2 к максимальному здоровью.",
      onAcquire: [
        { type: "changeMaxHp", amount: 2 },
      ],
    },
    {
      id: "frugalMage",
      name: "Экономный колдун",
      type: "universal",
      description: "Первое заклинание на каждом этаже не тратит ману.",
      onAcquire: [
        { type: "property", target: "freeFirstSpell", operation: "set", value: true },
      ],
    },
    {
      id: "nervousTalent",
      name: "Нервный, но талантливый",
      type: "universal",
      description: "+15% урона заклинаниями, но -1 к здоровью.",
      onAcquire: [
        { type: "property", target: "spellDamageMultiplier", operation: "add", value: 0.15 },
        { type: "property", target: "maxHp", operation: "add", value: -1 },
        { type: "capAt", target: "hp", maxTarget: "maxHp" },
      ],
    },
    {
      id: "pyromancer",
      name: "Пиромант",
      type: "elemental",
      element: "fire",
      description: "+25% урона огнем.",
      onAcquire: [
        { type: "property", target: "elementBonus.fire", operation: "set", value: 0.25 },
      ],
    },
    {
      id: "cryomancer",
      name: "Криомант",
      type: "elemental",
      element: "ice",
      description: "+25% урона льдом. На первом этаже есть Ледяная стрела.",
      onAcquire: [
        { type: "property", target: "elementBonus.ice", operation: "set", value: 0.25 },
      ],
    },
    {
      id: "poisoner",
      name: "Отравитель",
      type: "elemental",
      element: "poison",
      description: "Яд длится на 1 ход дольше. На первом этаже есть Ядовитое облако.",
      onAcquire: [
        { type: "property", target: "poisonBonusTurns", operation: "set", value: 1 },
      ],
    },
    {
      id: "stormStudent",
      name: "Грозовой ученик",
      type: "elemental",
      element: "lightning",
      description: "+25% урона молнией. На первом этаже есть Цепная молния.",
      onAcquire: [
        { type: "property", target: "elementBonus.lightning", operation: "set", value: 0.25 },
      ],
    },
    {
      id: "lightAcolyte",
      name: "Послушник света",
      type: "elemental",
      element: "light",
      description: "Свет лечит лучше. На первом этаже есть Луч рассвета.",
      onAcquire: [
        { type: "property", target: "lightHealBonus", operation: "set", value: 1 },
        { type: "property", target: "elementBonus.light", operation: "set", value: 0.15 },
      ],
    },
    {
      id: "shadowAdept",
      name: "Адепт тени",
      type: "elemental",
      element: "shadow",
      description: "Тьма сильнее добивает раненых. На первом этаже есть Теневой шип.",
      onAcquire: [
        { type: "property", target: "shadowWoundBonus", operation: "set", value: 1 },
      ],
    },
    {
      id: "stoneBlood",
      name: "Каменная кровь",
      type: "elemental",
      element: "earth",
      description: "Земляные эффекты дают больше защиты. На первом этаже есть Каменная броня.",
      onAcquire: [
        { type: "property", target: "earthShieldBonus", operation: "set", value: 1 },
      ],
    },
    {
      id: "windDancer",
      name: "Танцующий с ветром",
      type: "elemental",
      element: "wind",
      description: "Ветер отталкивает сильнее. На первом этаже есть Порыв ветра.",
      onAcquire: [
        { type: "property", target: "windPushBonus", operation: "set", value: 1 },
        { type: "property", target: "elementBonus.wind", operation: "set", value: 0.15 },
      ],
    },
  ];

  MT.registerData("traits", { TRAITS });
})(window);
