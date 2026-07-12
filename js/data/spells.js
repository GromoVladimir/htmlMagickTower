(function registerSpells(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerData !== "function") {
    throw new Error("MagicTower namespace must be loaded before data catalogs.");
  }

  const { SPELL_UPGRADE_COST } = MT.data.config;

  const SPELLS = {
    fireball: {
      id: "fireball",
      behaviorId: "fireball",
      name: "Огненный шар",
      element: "fire",
      level: 1,
      cost: 2,
      baseDamage: 3,
      range: 9,
      description: "Бьет первого врага на линии, может поджечь.",
    },
    iceShard: {
      id: "iceShard",
      behaviorId: "iceShard",
      name: "Ледяная стрела",
      element: "ice",
      level: 1,
      cost: 2,
      baseDamage: 2,
      range: 8,
      description: "Урон и замедление на 1-2 хода.",
    },
    poisonCloud: {
      id: "poisonCloud",
      behaviorId: "poisonCloud",
      name: "Ядовитое облако",
      element: "poison",
      level: 1,
      cost: 3,
      baseDamage: 1,
      range: 6,
      description: "Область яда на несколько ходов.",
    },
    chainLightning: {
      id: "chainLightning",
      behaviorId: "chainLightning",
      name: "Цепная молния",
      element: "lightning",
      level: 1,
      cost: 3,
      baseDamage: 3,
      range: 7,
      description: "Бьет ближайшего врага и перескакивает дальше.",
    },
    dawnRay: {
      id: "dawnRay",
      behaviorId: "dawnRay",
      name: "Луч рассвета",
      element: "light",
      level: 1,
      cost: 2,
      baseDamage: 2,
      range: 8,
      description: "Силен против нежити, лечит мага.",
    },
    shadowSpike: {
      id: "shadowSpike",
      behaviorId: "shadowSpike",
      name: "Теневой шип",
      element: "shadow",
      level: 1,
      cost: 2,
      baseDamage: 2,
      range: 7,
      description: "Наносит больше урона раненым врагам.",
    },
    stoneArmor: {
      id: "stoneArmor",
      behaviorId: "stoneArmor",
      name: "Каменная броня",
      element: "earth",
      level: 1,
      cost: 3,
      baseDamage: 0,
      range: 0,
      description: "Дает временный щит.",
    },
    windGust: {
      id: "windGust",
      behaviorId: "windGust",
      name: "Порыв ветра",
      element: "wind",
      level: 1,
      cost: 2,
      baseDamage: 1,
      range: 4,
      description: "Отталкивает ближайших врагов.",
    },
    magicMissile: {
      id: "magicMissile",
      behaviorId: "magicMissile",
      name: "Магическая стрела",
      element: "arcane",
      level: 1,
      cost: 1,
      baseDamage: 2,
      range: 8,
      description: "Дешевая стабильная атака.",
    },
  };

  const SPELL_UPGRADES = {
    fireball: {
      2: { cost: SPELL_UPGRADE_COST, text: "+1 урон", damageBonus: 1 },
      3: { cost: SPELL_UPGRADE_COST, text: "горение длится 3 хода", burnTurns: 3 },
    },
    iceShard: {
      2: { cost: SPELL_UPGRADE_COST, text: "+1 урон", damageBonus: 1 },
      3: { cost: SPELL_UPGRADE_COST, text: "замедление длится 3-4 хода", slowMin: 3, slowMax: 4 },
    },
    poisonCloud: {
      2: { cost: SPELL_UPGRADE_COST, text: "облако держится на 1 ход дольше", hazardTurnsBonus: 1 },
      3: { cost: SPELL_UPGRADE_COST, text: "ядовитое облако наносит 2 урона", hazardDamage: 2 },
    },
    chainLightning: {
      2: { cost: SPELL_UPGRADE_COST, text: "+1 урон", damageBonus: 1 },
      3: { cost: SPELL_UPGRADE_COST, text: "молния делает еще один скачок", chainJumps: 2 },
    },
    dawnRay: {
      2: { cost: SPELL_UPGRADE_COST, text: "+1 урон и +1 лечение", damageBonus: 1, healBonus: 1 },
      3: { cost: SPELL_UPGRADE_COST, text: "бонус против нежити становится +4", undeadBonus: 4 },
    },
    shadowSpike: {
      2: { cost: SPELL_UPGRADE_COST, text: "+1 урон", damageBonus: 1 },
      3: { cost: SPELL_UPGRADE_COST, text: "добивание раненых целей сильнее", woundedBonus: 2 },
    },
    stoneArmor: {
      2: { cost: SPELL_UPGRADE_COST, text: "+2 щита", shieldBonus: 2 },
      3: { cost: SPELL_UPGRADE_COST, text: "еще +2 щита", shieldBonus: 2 },
    },
    windGust: {
      2: { cost: SPELL_UPGRADE_COST, text: "+1 урон", damageBonus: 1 },
      3: { cost: SPELL_UPGRADE_COST, text: "столкновение наносит 1 урон", collisionDamage: 1 },
    },
    magicMissile: {
      2: { cost: SPELL_UPGRADE_COST, text: "+1 урон", damageBonus: 1 },
      3: { cost: SPELL_UPGRADE_COST, text: "еще +1 урон", damageBonus: 1 },
    },
  };

  const SPELL_EVOLUTIONS = {
    fireball: [
      {
        id: "pyroclast",
        name: "Пирокласт",
        description: "Оставляет горящую область и поджигает врагов внутри.",
        logText: "Огонь теперь держит зону под контролем.",
        hazardTurns: 2,
        hazardDamage: 1,
        burnTurns: 2,
      },
      {
        id: "solarMeteor",
        name: "Солнечный метеор",
        description: "Стоит дороже, но обрушивает мощный одиночный удар.",
        logText: "Пламя собирается в один тяжелый удар.",
        costModifier: 2,
        damageBonus: 4,
        burnConsumeBonus: 3,
      },
    ],
    iceShard: [
      {
        id: "icePrison",
        name: "Ледяная тюрьма",
        description: "Надолго сковывает одну цель.",
        logText: "Лед превращается в клетку для одной жертвы.",
        slowTurns: 5,
      },
      {
        id: "shardStorm",
        name: "Осколочная буря",
        description: "Осколки задевают врагов рядом с основной целью.",
        logText: "Лед рассыпается бурей по ближайшим врагам.",
        sideTargets: 2,
        sideRadius: 2,
        sideDamagePenalty: 1,
        slowTurns: 2,
      },
    ],
    poisonCloud: [
      {
        id: "plagueCloud",
        name: "Чумное облако",
        description: "Смерть в облаке рождает новое короткое облако.",
        logText: "Яд начинает переходить от павших к живым.",
        spreadTurns: 2,
      },
      {
        id: "acidMist",
        name: "Кислотный туман",
        description: "Кислота ослабляет цель для следующих ударов.",
        logText: "Яд становится едким и разъедает защиту.",
        acidTurns: 3,
        acidBonus: 1,
      },
    ],
    chainLightning: [
      {
        id: "stormChain",
        name: "Грозовая цепь",
        description: "Молния делает больше скачков на большей дистанции.",
        logText: "Разряд ищет все новые цели.",
        jumpBonus: 2,
        jumpRange: 5,
      },
      {
        id: "overload",
        name: "Перегрузка",
        description: "Меньше целей, но каждый удар может оглушить.",
        logText: "Молния бьет грубее и сбивает врагов с хода.",
        maxJumps: 1,
        jumpRange: 3,
        stunChance: 0.45,
        stunTurns: 1,
      },
    ],
    dawnRay: [
      {
        id: "dawnSpear",
        name: "Копье зари",
        description: "Пробивает всех врагов на линии взгляда.",
        logText: "Свет вытягивается в пронзающую линию.",
        damageBonus: 1,
      },
      {
        id: "holyCircle",
        name: "Священный круг",
        description: "Лечит, дает щит и ранит врагов вокруг мага.",
        logText: "Свет собирается вокруг мага защитным кругом.",
        radius: 2,
        heal: 2,
        shield: 2,
        damagePenalty: 1,
      },
    ],
    shadowSpike: [
      {
        id: "twilightBlade",
        name: "Клинок сумрака",
        description: "Сам ищет раненую цель и возвращает ману за добивание.",
        logText: "Тень тянется к уже ослабленным врагам.",
        executeBonus: 3,
        manaRefund: 1,
      },
      {
        id: "cursedMark",
        name: "Проклятая метка",
        description: "Помечает цель, усиливая следующие попадания по ней.",
        logText: "Тень оставляет на цели уязвимое проклятие.",
        markTurns: 3,
        markHits: 2,
        markBonus: 2,
      },
    ],
    stoneArmor: [
      {
        id: "graniteCarapace",
        name: "Гранитный панцирь",
        description: "Дает мощный щит и снижает входящий урон.",
        logText: "Камень ложится тяжелой защитной плитой.",
        shieldBonus: 5,
        reductionTurns: 3,
        reduction: 1,
      },
      {
        id: "earthBastion",
        name: "Земной бастион",
        description: "Дает щит и ставит временные каменные преграды.",
        logText: "Земля поднимает защитные выступы вокруг мага.",
        shieldBonus: 1,
        barrierTurns: 3,
        barrierCount: 3,
      },
    ],
    windGust: [
      {
        id: "hurricaneWall",
        name: "Ураганный вал",
        description: "Шире и сильнее отталкивает толпу.",
        logText: "Ветер превращается в широкую ударную волну.",
        rangeBonus: 2,
        pushBonus: 2,
        collisionDamageBonus: 1,
      },
      {
        id: "windStep",
        name: "Шаг ветра",
        description: "Сдвигает мага по направлению движения и дает щит.",
        logText: "Ветер переносит мага сквозь опасную позицию.",
        steps: 2,
        shield: 2,
      },
    ],
    magicMissile: [
      {
        id: "echoMissile",
        name: "Эхо стрелы",
        description: "После попадания ослабленное эхо бьет вторую цель.",
        logText: "Арканный снаряд оставляет второе эхо.",
        echoMultiplier: 0.5,
      },
      {
        id: "manaNeedle",
        name: "Мана-игла",
        description: "Возвращает ману, если добивает цель.",
        logText: "Стрела вытягивает искру маны из павшей цели.",
        manaRefund: 1,
      },
    ],
  };

  const BOOK_SPELLS = [
    "iceShard",
    "poisonCloud",
    "chainLightning",
    "dawnRay",
    "shadowSpike",
    "stoneArmor",
    "windGust",
    "magicMissile",
  ];

  const ELEMENT_TRAIT_BOOK = {
    ice: "iceShard",
    poison: "poisonCloud",
    lightning: "chainLightning",
    light: "dawnRay",
    shadow: "shadowSpike",
    earth: "stoneArmor",
    wind: "windGust",
  };

  MT.registerData("spells", {
    SPELLS,
    SPELL_UPGRADES,
    SPELL_EVOLUTIONS,
    BOOK_SPELLS,
    ELEMENT_TRAIT_BOOK,
  });
})(globalThis);
