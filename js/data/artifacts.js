(function registerArtifactCatalog(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerData !== "function") {
    throw new Error("MagicTower.registerData must be loaded before js/data/artifacts.js");
  }

  /**
   * @typedef {Object} EffectDescriptor
   * @property {"property"|"changeMaxHp"|"changeMaxMana"} type
   * @property {string} [target]
   * @property {"add"|"max"|"set"} [operation]
   * @property {*} [value]
   * @property {string} [valueFrom]
   * @property {number} [amount]
   */

  /**
   * @typedef {Object} PassiveCondition
   * @property {"hasElementSpell"|"hasElementEvolution"} type
   * @property {string} element
   */

  /**
   * @typedef {Object} PassiveDescriptor
   * @property {string} target
   * @property {"add"|"max"|"set"} operation
   * @property {*} value
   * @property {PassiveCondition} [condition]
   */

  /**
   * @typedef {Object} ArtifactHookDescriptor
   * @property {string} phase
   * @property {string} behaviorId
   * @property {number} priority
   */

  /**
   * @typedef {Object} ArtifactDefinition
   * @property {string} id
   * @property {string} name
   * @property {string} bonusText
   * @property {string} [curseText]
   * @property {number} [tier]
   * @property {number} [bossFloor]
   * @property {string} rarity
   * @property {boolean} cursed
   * @property {EffectDescriptor[]} onAcquire
   * @property {PassiveDescriptor[]} [passives]
   * @property {ArtifactHookDescriptor[]} [hooks]
   */

  /** @type {ArtifactDefinition[]} */
  const ARTIFACTS = [
    {
      id: "focusShard",
      name: "Осколок фокуса",
      bonusText: "+1 к урону всех заклинаний.",
      tier: 1,
      rarity: "rare",
      cursed: false,
      onAcquire: [
        { type: "property", target: "flatSpellBonus", operation: "add", value: 1 },
      ],
    },
    {
      id: "moonVessel",
      name: "Лунный сосуд",
      bonusText: "+3 к максимальной мане.",
      tier: 1,
      rarity: "common",
      cursed: false,
      onAcquire: [
        { type: "changeMaxMana", amount: 3 },
      ],
    },
    {
      id: "warmAmulet",
      name: "Теплый амулет",
      bonusText: "+2 к максимальному здоровью.",
      tier: 1,
      rarity: "common",
      cursed: false,
      onAcquire: [
        { type: "changeMaxHp", amount: 2 },
      ],
    },
    {
      id: "scoutLens",
      name: "Линза разведчика",
      bonusText: "+1 к обзору, книги, сундуки и артефакты подсвечиваются рядом.",
      tier: 1,
      rarity: "common",
      cursed: false,
      onAcquire: [
        { type: "property", target: "visionBonus", operation: "add", value: 1 },
        { type: "property", target: "revealsSecrets", operation: "set", value: true },
      ],
    },
    {
      id: "stoneSeal",
      name: "Каменная печать",
      bonusText: "+2 к максимальной мане. Если есть земля: Каменная броня дает +1 щит.",
      tier: 1,
      rarity: "rare",
      cursed: false,
      onAcquire: [
        { type: "changeMaxMana", amount: 2 },
      ],
      passives: [
        {
          target: "earthShieldBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "earth" },
        },
      ],
    },
    {
      id: "windCharm",
      name: "Ветряной оберег",
      bonusText: "+1 урон посохом и +2 к максимальной мане. Если есть ветер: Порыв ветра отталкивает сильнее.",
      tier: 1,
      rarity: "rare",
      cursed: false,
      onAcquire: [
        { type: "property", target: "staffDamage", operation: "add", value: 1 },
        { type: "changeMaxMana", amount: 2 },
      ],
      passives: [
        {
          target: "windPushBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "wind" },
        },
      ],
    },
    {
      id: "salamanderSeal",
      name: "Печать саламандры",
      bonusText: "+2 к максимальной мане. Если есть огонь: горение длится на 1 ход дольше. Если огонь эволюционировал: огонь наносит +1 урон горящим врагам.",
      tier: 2,
      rarity: "rare",
      cursed: false,
      onAcquire: [
        { type: "changeMaxMana", amount: 2 },
      ],
      passives: [
        {
          target: "fireBurnBonusTurns",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "fire" },
        },
        {
          target: "fireDamageToBurning",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "fire" },
        },
      ],
    },
    {
      id: "stormHeart",
      name: "Сердце грозы",
      bonusText: "+1 к максимальной мане и +1 к обзору. Если есть молния: цепная молния делает +1 скачок. Если молния эволюционировала: молния наносит +1 урон.",
      tier: 2,
      rarity: "rare",
      cursed: false,
      onAcquire: [
        { type: "changeMaxMana", amount: 1 },
        { type: "property", target: "visionBonus", operation: "add", value: 1 },
      ],
      passives: [
        {
          target: "lightningChainBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "lightning" },
        },
        {
          target: "lightningDamageBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "lightning" },
        },
      ],
    },
    {
      id: "iceLens",
      name: "Ледяная линза",
      bonusText: "+1 щит при входе на этаж. Если есть лед: замедленные враги получают +1 урон от льда. Если лед эволюционировал: ледяное замедление длится на 1 ход дольше.",
      tier: 2,
      rarity: "rare",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "floorStartShield", operation: "add", value: 1 },
        {
          target: "iceDamageToSlowed",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "ice" },
        },
        {
          target: "iceSlowBonusTurns",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "ice" },
        },
      ],
    },
    {
      id: "duskMask",
      name: "Маска сумрака",
      bonusText: "Раз за этаж убийство врага восстанавливает 1 ману. Если есть тьма: убийство тьмой восстанавливает еще 1 ману. Если тьма эволюционировала: после убийства тьмой следующее заклинание получает +1 урон.",
      tier: 2,
      rarity: "rare",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "floorKillMana", operation: "add", value: 1 },
        {
          target: "shadowKillManaBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "shadow" },
        },
        {
          target: "shadowKillNextSpellDamage",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "shadow" },
        },
      ],
      hooks: [
        { phase: "enemyDefeated", behaviorId: "killMana", priority: 100 },
      ],
    },
    {
      id: "livingRoot",
      name: "Живой корень",
      bonusText: "+2 к максимальному здоровью. Если есть яд: ядовитое облако длится на 1 ход дольше. Если яд эволюционировал: яд и кислота наносят +1 урон.",
      tier: 2,
      rarity: "common",
      cursed: false,
      onAcquire: [
        { type: "changeMaxHp", amount: 2 },
      ],
      passives: [
        {
          target: "poisonHazardTurns",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "poison" },
        },
        {
          target: "poisonHazardDamage",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "poison" },
        },
      ],
    },
    {
      id: "galeFeather",
      name: "Перо вихря",
      bonusText: "После полученного урона раз в 4 хода дает 1 щит. Если есть ветер: заклинания ветра дают +1 щит. Если ветер эволюционировал: заклинания ветра дают +2 щита.",
      tier: 2,
      rarity: "rare",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "damageShield", operation: "add", value: 1 },
        { target: "damageShieldCooldown", operation: "max", value: 4 },
        {
          target: "windSpellShield",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "wind" },
        },
        {
          target: "windSpellShield",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "wind" },
        },
      ],
      hooks: [
        { phase: "afterSpellCast", behaviorId: "windSpellShield", priority: 100 },
        { phase: "afterDamageTaken", behaviorId: "damageShield", priority: 100 },
      ],
    },
    {
      id: "sevenElementsCrown",
      name: "Корона семи стихий",
      bonusText: "+1 к урону всех заклинаний. Если использовать разные стихии подряд, второе заклинание стоит на 1 ману дешевле.",
      tier: 3,
      rarity: "legendary",
      cursed: false,
      onAcquire: [
        { type: "property", target: "flatSpellBonus", operation: "add", value: 1 },
      ],
      passives: [
        { target: "alternatingElementDiscount", operation: "max", value: 1 },
      ],
      hooks: [
        { phase: "spellCost", behaviorId: "alternatingElementDiscount", priority: 200 },
      ],
    },
    {
      id: "blackSun",
      name: "Черное солнце",
      bonusText: "+3 к максимальной мане и +1 к урону всех заклинаний. Если есть свет или тьма: эти заклинания наносят еще +1 урон. Если они эволюционировали: свет лечит на 1 больше, тьма сильнее добивает раненых.",
      tier: 3,
      rarity: "epic",
      cursed: false,
      onAcquire: [
        { type: "changeMaxMana", amount: 3 },
        { type: "property", target: "flatSpellBonus", operation: "add", value: 1 },
      ],
      passives: [
        {
          target: "lightDamageBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "light" },
        },
        {
          target: "shadowDamageBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "shadow" },
        },
        {
          target: "lightHealBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "light" },
        },
        {
          target: "shadowWoundBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "shadow" },
        },
      ],
    },
    {
      id: "archmageVessel",
      name: "Сосуд архимага",
      bonusText: "+6 к максимальной мане. Первое заклинание на каждом этаже стоит на 1 ману дешевле.",
      tier: 3,
      rarity: "epic",
      cursed: false,
      onAcquire: [
        { type: "changeMaxMana", amount: 6 },
      ],
      passives: [
        { target: "firstSpellDiscount", operation: "max", value: 1 },
      ],
      hooks: [
        { phase: "spellCost", behaviorId: "firstSpellDiscount", priority: 100 },
      ],
    },
    {
      id: "ashenHeart",
      name: "Пепельное сердце",
      bonusText: "+1 урон по врагам с негативным статусом. Если есть огонь: огонь наносит еще +1 урон горящим врагам. Если огонь эволюционировал: горение наносит +1 урон.",
      tier: 3,
      rarity: "epic",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "statusDamageBonus", operation: "add", value: 1 },
        {
          target: "fireDamageToBurning",
          operation: "add",
          value: 1,
          condition: { type: "hasElementSpell", element: "fire" },
        },
        {
          target: "burnTickBonus",
          operation: "add",
          value: 1,
          condition: { type: "hasElementEvolution", element: "fire" },
        },
      ],
    },
    {
      id: "firstMageMirror",
      name: "Зеркало первого мага",
      bonusText: "Первое заклинание на каждом этаже срабатывает дважды. После этого восстанавливается 1 мана.",
      tier: 3,
      rarity: "legendary",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "firstSpellEcho", operation: "set", value: true },
        { target: "firstSpellEchoManaRefund", operation: "max", value: 1 },
        {
          target: "firstSpellEchoMessage",
          operation: "set",
          value: "Зеркало первого мага повторяет первое заклинание этажа.",
        },
      ],
      hooks: [
        { phase: "beforeSpellCast", behaviorId: "firstSpellEcho", priority: 100 },
      ],
    },
    {
      id: "lastChanceStone",
      name: "Камень последнего шанса",
      bonusText: "При смертельном уроне маг остается с 1 здоровьем и получает 4 щита. После срабатывания артефакт становится неактивным.",
      tier: 3,
      rarity: "legendary",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "lastChance", operation: "set", value: true },
      ],
      hooks: [
        { phase: "beforePlayerDefeat", behaviorId: "lastChance", priority: 100 },
      ],
    },
    {
      id: "crackedCrown",
      name: "Треснувшая корона",
      bonusText: "+35% урона заклинаниями.",
      curseText: "-2 к максимальному здоровью.",
      tier: 1,
      rarity: "cursed",
      cursed: true,
      onAcquire: [
        { type: "property", target: "spellDamageMultiplier", operation: "add", value: 0.35 },
        { type: "changeMaxHp", amount: -2 },
      ],
    },
    {
      id: "bottomlessVessel",
      name: "Бездонный сосуд",
      bonusText: "+7 к максимальной мане.",
      curseText: "Мана восстанавливается на 1 ход реже.",
      tier: 3,
      rarity: "cursed",
      cursed: true,
      onAcquire: [
        { type: "changeMaxMana", amount: 7 },
        { type: "property", target: "manaRegenEvery", operation: "add", value: 1 },
      ],
    },
    {
      id: "watchingThorn",
      name: "Зрячий шип",
      bonusText: "+2 к обзору и +1 к урону всех заклинаний.",
      curseText: "-3 к максимальной мане.",
      tier: 2,
      rarity: "cursed",
      cursed: true,
      onAcquire: [
        { type: "property", target: "visionBonus", operation: "add", value: 2 },
        { type: "property", target: "flatSpellBonus", operation: "add", value: 1 },
        { type: "changeMaxMana", amount: -3 },
      ],
    },
    {
      id: "graniteHeart",
      name: "Сердце гранита",
      bonusText: "+5 к максимальному здоровью.",
      curseText: "-1 к обзору.",
      tier: 1,
      rarity: "cursed",
      cursed: true,
      onAcquire: [
        { type: "changeMaxHp", amount: 5 },
        { type: "property", target: "visionBonus", operation: "add", value: -1 },
      ],
    },
    {
      id: "blackMantle",
      name: "Черная мантия",
      bonusText: "+2 к урону всех заклинаний.",
      curseText: "Все заклинания стоят на 1 ману больше.",
      tier: 3,
      rarity: "cursed",
      cursed: true,
      onAcquire: [
        { type: "property", target: "flatSpellBonus", operation: "add", value: 2 },
        { type: "property", target: "spellCostModifier", operation: "add", value: 1 },
      ],
    },
  ];

  /** @type {ArtifactDefinition[]} */
  const SECRET_ARTIFACTS = [
    {
      id: "forgottenArchmageKey",
      name: "Ключ забытого архимага",
      bonusText: "+1 осколок магии сразу. Восстанавливает всю ману. Первое улучшение или эволюция заклинания после получения стоит на 1 осколок дешевле.",
      tier: 3,
      rarity: "secret",
      cursed: false,
      onAcquire: [
        { type: "property", target: "magicShards", operation: "add", value: 1 },
        { type: "property", target: "mana", operation: "set", valueFrom: "maxMana" },
        { type: "property", target: "spellUpgradeDiscount", operation: "max", value: 1 },
      ],
    },
  ];

  /** @type {ArtifactDefinition[]} */
  const BOSS_RELICS = [
    {
      id: "resilienceCore",
      bossFloor: 5,
      name: "Ядро стойкости",
      bonusText: "+3 к максимальному здоровью. Первый полученный урон на каждом этаже уменьшается на 1.",
      rarity: "bossRelic",
      cursed: false,
      onAcquire: [
        { type: "changeMaxHp", amount: 3 },
      ],
      passives: [
        { target: "firstDamageReduction", operation: "max", value: 1 },
      ],
      hooks: [
        { phase: "beforeDamageTaken", behaviorId: "firstDamageReduction", priority: 100 },
      ],
    },
    {
      id: "ancientStoneWeight",
      bossFloor: 5,
      name: "Тяжесть древнего камня",
      bonusText: "Когда враг впервые за этаж подходит вплотную к магу, он замедляется на 2 хода.",
      rarity: "bossRelic",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "contactSlowTurns", operation: "max", value: 2 },
      ],
    },
    {
      id: "bastionShard",
      bossFloor: 5,
      name: "Осколок бастиона",
      bonusText: "После получения урона маг получает 2 щита. Срабатывает не чаще одного раза за 3 хода.",
      rarity: "bossRelic",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "bastionShield", operation: "add", value: 2 },
        { target: "bastionShieldCooldown", operation: "max", value: 3 },
      ],
      hooks: [
        { phase: "afterDamageTaken", behaviorId: "bastionShard", priority: 200 },
      ],
    },
    {
      id: "mirrorFocusRelic",
      bossFloor: 10,
      name: "Зеркальный фокус",
      bonusText: "Первое примененное заклинание на каждом этаже срабатывает дважды без второй траты маны.",
      rarity: "bossRelic",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "firstSpellEcho", operation: "set", value: true },
        {
          target: "firstSpellEchoMessage",
          operation: "set",
          value: "Зеркальный фокус повторяет первое заклинание этажа.",
        },
      ],
      hooks: [
        { phase: "beforeSpellCast", behaviorId: "firstSpellEcho", priority: 100 },
      ],
    },
    {
      id: "glassMemory",
      bossFloor: 10,
      name: "Стеклянная память",
      bonusText: "Если применить три разных заклинания подряд, следующее заклинание стоит на 1 ману дешевле.",
      rarity: "bossRelic",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "glassMemoryDiscount", operation: "max", value: 1 },
      ],
      hooks: [
        { phase: "spellCost", behaviorId: "glassMemoryDiscount", priority: 300 },
        { phase: "afterSpellResolved", behaviorId: "glassMemory", priority: 100 },
      ],
    },
    {
      id: "reflectionShard",
      bossFloor: 10,
      name: "Осколок отражения",
      bonusText: "Первый полученный урон на каждом этаже возвращает 2 урона атакующему, если цель известна.",
      rarity: "bossRelic",
      cursed: false,
      onAcquire: [],
      passives: [
        { target: "firstDamageReflect", operation: "max", value: 2 },
      ],
      hooks: [
        { phase: "afterDamageTaken", behaviorId: "reflectionShard", priority: 300 },
      ],
    },
  ];

  MT.registerData("artifacts", {
    ARTIFACTS,
    SECRET_ARTIFACTS,
    BOSS_RELICS,
  });
})(window);
