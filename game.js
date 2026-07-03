(() => {
  "use strict";

  const CONFIG = {
    mapWidth: 40,
    mapHeight: 25,
    tileSize: 22,
    maxFloors: 15,
    logLimit: 9,
    roomAttempts: 130,
    manaRegenEvery: 4,
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

  const SPELLS = {
    fireball: {
      id: "fireball",
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
      name: "Магическая стрела",
      element: "arcane",
      level: 1,
      cost: 1,
      baseDamage: 2,
      range: 8,
      description: "Дешевая стабильная атака.",
    },
  };

  const MAX_SPELL_LEVEL = 3;
  const SPELL_UPGRADE_COST = 1;
  const EVOLUTION_COST = 1;

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

  const TRAITS = [
    {
      id: "deepReserve",
      name: "Глубокий резерв",
      type: "universal",
      description: "+4 к максимальной мане.",
      apply(player) {
        player.maxMana += 4;
        player.mana += 4;
      },
    },
    {
      id: "battleMage",
      name: "Ученик боевого мага",
      type: "universal",
      description: "+1 к урону всех заклинаний.",
      apply(player) {
        player.flatSpellBonus += 1;
      },
    },
    {
      id: "fastFocus",
      name: "Быстрая концентрация",
      type: "universal",
      description: "Мана восстанавливается чаще.",
      apply(player) {
        player.manaRegenEvery = 3;
      },
    },
    {
      id: "carefulExplorer",
      name: "Осторожный исследователь",
      type: "universal",
      description: "Первый полученный урон на каждом этаже блокируется.",
      apply(player) {
        player.blocksFirstHit = true;
      },
    },
    {
      id: "secretSeeker",
      name: "Искатель тайн",
      type: "universal",
      description: "Книги и сундуки подсвечиваются рядом.",
      apply(player) {
        player.revealsSecrets = true;
      },
    },
    {
      id: "sturdy",
      name: "Живучий",
      type: "universal",
      description: "+2 к максимальному здоровью.",
      apply(player) {
        player.maxHp += 2;
        player.hp += 2;
      },
    },
    {
      id: "frugalMage",
      name: "Экономный колдун",
      type: "universal",
      description: "Первое заклинание на каждом этаже не тратит ману.",
      apply(player) {
        player.freeFirstSpell = true;
      },
    },
    {
      id: "nervousTalent",
      name: "Нервный, но талантливый",
      type: "universal",
      description: "+15% урона заклинаниями, но -1 к здоровью.",
      apply(player) {
        player.spellDamageMultiplier += 0.15;
        player.maxHp -= 1;
        player.hp = Math.min(player.hp, player.maxHp);
      },
    },
    {
      id: "pyromancer",
      name: "Пиромант",
      type: "elemental",
      element: "fire",
      description: "+25% урона огнем.",
      apply(player) {
        player.elementBonus.fire = 0.25;
      },
    },
    {
      id: "cryomancer",
      name: "Криомант",
      type: "elemental",
      element: "ice",
      description: "+25% урона льдом. На первом этаже есть Ледяная стрела.",
      apply(player) {
        player.elementBonus.ice = 0.25;
      },
    },
    {
      id: "poisoner",
      name: "Отравитель",
      type: "elemental",
      element: "poison",
      description: "Яд длится на 1 ход дольше. На первом этаже есть Ядовитое облако.",
      apply(player) {
        player.poisonBonusTurns = 1;
      },
    },
    {
      id: "stormStudent",
      name: "Грозовой ученик",
      type: "elemental",
      element: "lightning",
      description: "+25% урона молнией. На первом этаже есть Цепная молния.",
      apply(player) {
        player.elementBonus.lightning = 0.25;
      },
    },
    {
      id: "lightAcolyte",
      name: "Послушник света",
      type: "elemental",
      element: "light",
      description: "Свет лечит лучше. На первом этаже есть Луч рассвета.",
      apply(player) {
        player.lightHealBonus = 1;
        player.elementBonus.light = 0.15;
      },
    },
    {
      id: "shadowAdept",
      name: "Адепт тени",
      type: "elemental",
      element: "shadow",
      description: "Тьма сильнее добивает раненых. На первом этаже есть Теневой шип.",
      apply(player) {
        player.shadowWoundBonus = 1;
      },
    },
    {
      id: "stoneBlood",
      name: "Каменная кровь",
      type: "elemental",
      element: "earth",
      description: "Земляные эффекты дают больше защиты. На первом этаже есть Каменная броня.",
      apply(player) {
        player.earthShieldBonus = 1;
      },
    },
    {
      id: "windDancer",
      name: "Танцующий с ветром",
      type: "elemental",
      element: "wind",
      description: "Ветер отталкивает сильнее. На первом этаже есть Порыв ветра.",
      apply(player) {
        player.windPushBonus = 1;
        player.elementBonus.wind = 0.15;
      },
    },
  ];

  const ARTIFACTS = [
    {
      id: "focusShard",
      name: "Осколок фокуса",
      bonusText: "+1 к урону всех заклинаний.",
      cursed: false,
      apply(player) {
        player.flatSpellBonus += 1;
      },
    },
    {
      id: "moonVessel",
      name: "Лунный сосуд",
      bonusText: "+3 к максимальной мане.",
      cursed: false,
      apply(player) {
        changeMaxMana(player, 3);
      },
    },
    {
      id: "warmAmulet",
      name: "Теплый амулет",
      bonusText: "+2 к максимальному здоровью.",
      cursed: false,
      apply(player) {
        changeMaxHp(player, 2);
      },
    },
    {
      id: "scoutLens",
      name: "Линза разведчика",
      bonusText: "+1 к обзору, книги, сундуки и артефакты подсвечиваются рядом.",
      cursed: false,
      apply(player) {
        player.visionBonus += 1;
        player.revealsSecrets = true;
      },
    },
    {
      id: "stoneSeal",
      name: "Каменная печать",
      bonusText: "Каменная броня дает на 1 щит больше, +2 к максимальной мане.",
      cursed: false,
      apply(player) {
        player.earthShieldBonus += 1;
        changeMaxMana(player, 2);
      },
    },
    {
      id: "windCharm",
      name: "Ветряной оберег",
      bonusText: "Порыв ветра отталкивает сильнее, посох наносит +1 урон, +2 к максимальной мане.",
      cursed: false,
      apply(player) {
        player.windPushBonus += 1;
        player.staffDamage += 1;
        changeMaxMana(player, 2);
      },
    },
    {
      id: "crackedCrown",
      name: "Треснувшая корона",
      bonusText: "+35% урона заклинаниями.",
      curseText: "-2 к максимальному здоровью.",
      cursed: true,
      apply(player) {
        player.spellDamageMultiplier += 0.35;
        changeMaxHp(player, -2);
      },
    },
    {
      id: "bottomlessVessel",
      name: "Бездонный сосуд",
      bonusText: "+7 к максимальной мане.",
      curseText: "Мана восстанавливается на 1 ход реже.",
      cursed: true,
      apply(player) {
        changeMaxMana(player, 7);
        player.manaRegenEvery += 1;
      },
    },
    {
      id: "watchingThorn",
      name: "Зрячий шип",
      bonusText: "+2 к обзору и +1 к урону всех заклинаний.",
      curseText: "-3 к максимальной мане.",
      cursed: true,
      apply(player) {
        player.visionBonus += 2;
        player.flatSpellBonus += 1;
        changeMaxMana(player, -3);
      },
    },
    {
      id: "graniteHeart",
      name: "Сердце гранита",
      bonusText: "+5 к максимальному здоровью.",
      curseText: "-1 к обзору.",
      cursed: true,
      apply(player) {
        changeMaxHp(player, 5);
        player.visionBonus -= 1;
      },
    },
    {
      id: "blackMantle",
      name: "Черная мантия",
      bonusText: "+2 к урону всех заклинаний.",
      curseText: "Все заклинания стоят на 1 ману больше.",
      cursed: true,
      apply(player) {
        player.flatSpellBonus += 2;
        player.spellCostModifier += 1;
      },
    },
  ];

  const ENEMY_TYPES = {
    rat: {
      name: "Башенная крыса",
      glyph: "r",
      color: "#bb7d54",
      hp: 3,
      damage: 1,
      speed: 1,
      range: 1,
      xp: 0,
    },
    skeleton: {
      name: "Скелет-страж",
      glyph: "S",
      color: "#d8d8c8",
      hp: 5,
      damage: 2,
      speed: 2,
      range: 1,
      weakTo: ["light"],
      tags: ["undead"],
    },
    livingBook: {
      name: "Ожившая книга",
      glyph: "B",
      color: "#d767b8",
      hp: 4,
      damage: 1,
      speed: 1,
      range: 4,
      ranged: true,
      weakTo: ["lightning", "wind"],
    },
    smallGolem: {
      name: "Малый голем",
      glyph: "g",
      color: "#a18d72",
      hp: 3,
      damage: 1,
      speed: 2,
      range: 1,
      summoned: true,
      minion: true,
      weakTo: ["ice", "shadow"],
    },
    boss: {
      name: "Каменный архиголем",
      glyph: "A",
      color: "#c0a46b",
      hp: 24,
      damage: 3,
      speed: 1,
      range: 1,
      boss: true,
      weakTo: ["ice", "light"],
      attackText: "Каменный архиголем обрушивает тяжелый кулак.",
    },
    mirrorArchmage: {
      name: "Зеркальный архимаг",
      glyph: "M",
      color: "#9bdcff",
      hp: 30,
      damage: 3,
      speed: 1,
      range: 5,
      ranged: true,
      boss: true,
      weakTo: ["shadow", "lightning"],
      attackText: "Зеркальный архимаг выпускает преломленный луч.",
    },
    mirrorIllusion: {
      name: "Зеркальная иллюзия",
      glyph: "i",
      color: "#c9f5ff",
      hp: 2,
      damage: 1,
      speed: 1,
      range: 4,
      ranged: true,
      summoned: true,
      minion: true,
      illusion: true,
      attackText: "Зеркальная иллюзия сбивает фокус слабой вспышкой.",
      defeatText: "Зеркальная иллюзия рассыпается.",
    },
    towerAvatar: {
      name: "Сердце башни / Аватар башни",
      glyph: "T",
      color: "#ff6f9f",
      hp: 40,
      damage: 4,
      speed: 1,
      range: 4,
      ranged: true,
      boss: true,
      weakTo: ["light", "arcane"],
      attackText: "Аватар башни сжимает пространство вокруг мага.",
    },
    towerShard: {
      name: "Осколок башни",
      glyph: "◆",
      color: "#ff9ec2",
      hp: 6,
      damage: 0,
      speed: 1,
      range: 0,
      summoned: true,
      object: true,
      weakTo: ["light", "arcane"],
      defeatText: "Осколок башни расколот.",
    },
  };

  const ACTS = [
    {
      id: "stoneThreshold",
      name: "Каменный порог",
      floorRange: [1, 5],
      enemyPool: "tower",
      artifactPool: "tower",
    },
    {
      id: "mirrorHalls",
      name: "Зеркальные залы",
      floorRange: [6, 10],
      enemyPool: "tower",
      artifactPool: "tower",
    },
    {
      id: "towerHeart",
      name: "Сердце башни",
      floorRange: [11, 15],
      enemyPool: "tower",
      artifactPool: "tower",
    },
  ];

  const FLOOR_RULES = {
    1: {
      targetRooms: 8,
      maxRoomSize: 8,
      maxRoomHeight: 7,
      enemyCount: 5,
      minEnemyDistanceFromStart: 6,
      resourceCount: 2,
      artifactCount: 1,
      bonusArtifactChance: 0,
      cursedArtifactChance: 0.3,
      trapCount: 0,
      firstFloorBooks: true,
      stairs: true,
    },
    2: {
      targetRooms: 9,
      maxRoomSize: 8,
      maxRoomHeight: 7,
      enemyCount: 5,
      minEnemyDistanceFromStart: 0,
      resourceCount: 2,
      artifactCount: 1,
      bonusArtifactChance: 0,
      cursedArtifactChance: 0.3,
      trapCount: 3,
      firstFloorBooks: false,
      stairs: true,
    },
    3: {
      targetRooms: 10,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 5,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.5,
      cursedArtifactChance: 0.45,
      trapCount: 4,
      firstFloorBooks: false,
      stairs: true,
    },
    4: {
      targetRooms: 11,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 6,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.5,
      cursedArtifactChance: 0.45,
      trapCount: 5,
      firstFloorBooks: false,
      stairs: true,
    },
    5: {
      targetRooms: 7,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 0,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.5,
      cursedArtifactChance: 0.45,
      trapCount: 0,
      firstFloorBooks: false,
      stairs: false,
    },
    6: {
      targetRooms: 9,
      maxRoomSize: 8,
      maxRoomHeight: 7,
      enemyCount: 6,
      minEnemyDistanceFromStart: 0,
      resourceCount: 2,
      artifactCount: 1,
      bonusArtifactChance: 0.25,
      cursedArtifactChance: 0.35,
      trapCount: 3,
      firstFloorBooks: false,
      stairs: true,
    },
    7: {
      targetRooms: 10,
      maxRoomSize: 8,
      maxRoomHeight: 7,
      enemyCount: 6,
      minEnemyDistanceFromStart: 0,
      resourceCount: 2,
      artifactCount: 1,
      bonusArtifactChance: 0.25,
      cursedArtifactChance: 0.35,
      trapCount: 3,
      firstFloorBooks: false,
      stairs: true,
    },
    8: {
      targetRooms: 10,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 7,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.4,
      cursedArtifactChance: 0.45,
      trapCount: 4,
      firstFloorBooks: false,
      stairs: true,
    },
    9: {
      targetRooms: 11,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 7,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.4,
      cursedArtifactChance: 0.45,
      trapCount: 4,
      firstFloorBooks: false,
      stairs: true,
    },
    10: {
      targetRooms: 7,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 0,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.5,
      cursedArtifactChance: 0.45,
      trapCount: 0,
      firstFloorBooks: false,
      stairs: false,
    },
    11: {
      targetRooms: 10,
      maxRoomSize: 8,
      maxRoomHeight: 7,
      enemyCount: 7,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.5,
      cursedArtifactChance: 0.45,
      trapCount: 4,
      firstFloorBooks: false,
      stairs: true,
    },
    12: {
      targetRooms: 10,
      maxRoomSize: 8,
      maxRoomHeight: 7,
      enemyCount: 7,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.5,
      cursedArtifactChance: 0.45,
      trapCount: 4,
      firstFloorBooks: false,
      stairs: true,
    },
    13: {
      targetRooms: 11,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 8,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.6,
      cursedArtifactChance: 0.5,
      trapCount: 5,
      firstFloorBooks: false,
      stairs: true,
    },
    14: {
      targetRooms: 11,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 8,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.6,
      cursedArtifactChance: 0.5,
      trapCount: 5,
      firstFloorBooks: false,
      stairs: true,
    },
    15: {
      targetRooms: 7,
      maxRoomSize: 7,
      maxRoomHeight: 6,
      enemyCount: 0,
      minEnemyDistanceFromStart: 0,
      resourceCount: 3,
      artifactCount: 1,
      bonusArtifactChance: 0.5,
      cursedArtifactChance: 0.5,
      trapCount: 0,
      firstFloorBooks: false,
      stairs: false,
    },
  };

  const BOSSES_BY_FLOOR = {
    5: "boss",
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
      shardCooldown: 5,
      shardDamageBonus: 1,
      shardPulseEvery: 3,
      shardHp: 6,
      hazardTurns: 4,
      attackBoost: 1,
      minShardDistanceFromPlayer: 2,
    },
  };

  const ENEMY_POOLS_BY_ACT = {
    tower: {
      default: ["rat", "skeleton", "livingBook"],
      byFloor: {
        1: ["rat", "rat", "skeleton"],
      },
    },
  };

  const ARTIFACT_POOLS_BY_ACT = {
    tower: {
      clean: ["focusShard", "moonVessel", "warmAmulet", "scoutLens", "stoneSeal", "windCharm"],
      cursed: ["crackedCrown", "bottomlessVessel", "watchingThorn", "graniteHeart", "blackMantle"],
    },
  };

  const REWARD_RULES = {
    floorManaRestore: 3,
    chestMana: 3,
    altarHeal: 3,
    maxKnownSpells: 3,
    firstFloorBookCount: 2,
    bookSpellPool: BOOK_SPELLS,
    elementalTraitBooks: ELEMENT_TRAIT_BOOK,
  };

  const MAGIC_SHARD_REWARDS = {
    floors: {
      3: "Этаж 3 раскрывает тайный осколок магии.",
      7: "Этаж 7 отдает спрятанный осколок магии.",
      9: "Этаж 9 вспыхивает найденным осколком магии.",
      12: "Этаж 12 дарит редкий осколок магии.",
    },
    bosses: {
      5: "После победы над стражем остается осколок магии.",
      10: "Побежденный босс оставляет осколок магии.",
    },
  };

  const EVENT_TYPES = {
    STAIRS: "stairs",
    BOOK: "book",
    CHEST: "chest",
    ALTAR: "altar",
    TRAP: "trap",
    ARTIFACT: "artifact",
  };

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
    overlayKicker: document.getElementById("overlayKicker"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayText: document.getElementById("overlayText"),
    primaryAction: document.getElementById("primaryAction"),
  };

  const ctx = dom.canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const state = {
    mode: MODES.MENU,
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
    idCounter: 1,
    lastMoveDir: { x: 1, y: 0 },
  };

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function sample(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function nextId() {
    state.idCounter += 1;
    return state.idCounter;
  }

  function changeMaxHp(player, amount) {
    player.maxHp = Math.max(1, player.maxHp + amount);
    if (amount > 0) {
      player.hp += amount;
    }
    player.hp = clamp(player.hp, 1, player.maxHp);
  }

  function changeMaxMana(player, amount) {
    player.maxMana = Math.max(1, player.maxMana + amount);
    if (amount > 0) {
      player.mana += amount;
    }
    player.mana = clamp(player.mana, 0, player.maxMana);
  }

  function spellCost(spell) {
    const evolution = spellEvolution(spell.id);
    const evolutionCost = evolution?.costModifier || 0;
    return Math.max(0, spell.cost + (state.player?.spellCostModifier || 0) + evolutionCost);
  }

  function spellLevel(spellId) {
    if (!state.player) {
      return SPELLS[spellId]?.level || 1;
    }
    return state.player.spellLevels[spellId] || SPELLS[spellId]?.level || 1;
  }

  function nextSpellUpgrade(spellId) {
    const nextLevel = spellLevel(spellId) + 1;
    return SPELL_UPGRADES[spellId]?.[nextLevel] || null;
  }

  function evolutionOptions(spellId) {
    return SPELL_EVOLUTIONS[spellId] || [];
  }

  function evolutionById(spellId, evolutionId) {
    return evolutionOptions(spellId).find((evolution) => evolution.id === evolutionId) || null;
  }

  function spellEvolution(spellId) {
    if (!state.player?.spellEvolutions) {
      return null;
    }
    return evolutionById(spellId, state.player.spellEvolutions[spellId]);
  }

  function hasEvolution(spellId) {
    return Boolean(spellEvolution(spellId));
  }

  function canEvolveSpell(spellId) {
    return Boolean(
      state.player &&
      spellLevel(spellId) >= MAX_SPELL_LEVEL &&
      !hasEvolution(spellId) &&
      evolutionOptions(spellId).length &&
      state.player.magicShards >= EVOLUTION_COST
    );
  }

  function spellUpgradeTotal(spellId, key) {
    const upgrades = SPELL_UPGRADES[spellId] || {};
    let total = 0;
    for (let level = 2; level <= spellLevel(spellId); level += 1) {
      total += upgrades[level]?.[key] || 0;
    }
    return total;
  }

  function spellUpgradeOverride(spellId, key, fallback) {
    const upgrades = SPELL_UPGRADES[spellId] || {};
    let value = fallback;
    for (let level = 2; level <= spellLevel(spellId); level += 1) {
      if (Object.prototype.hasOwnProperty.call(upgrades[level] || {}, key)) {
        value = upgrades[level][key];
      }
    }
    return value;
  }

  function grantMagicShardReward(key, message) {
    if (!state.player || state.player.claimedMagicShardRewards[key]) {
      return false;
    }
    state.player.claimedMagicShardRewards[key] = true;
    state.player.magicShards += 1;
    addLog(`${message} +1 осколок магии.`);
    return true;
  }

  function grantFloorMagicShardReward(floor) {
    const message = MAGIC_SHARD_REWARDS.floors[floor];
    if (message) {
      grantMagicShardReward(`floor:${floor}`, message);
    }
  }

  function grantBossMagicShardReward(floor) {
    const message = MAGIC_SHARD_REWARDS.bosses[floor];
    if (message) {
      grantMagicShardReward(`boss:${floor}`, message);
    }
  }

  function createFlagMap(value = false) {
    return Array.from({ length: CONFIG.mapHeight }, () =>
      Array.from({ length: CONFIG.mapWidth }, () => value)
    );
  }

  function artifactById(id) {
    return ARTIFACTS.find((artifact) => artifact.id === id);
  }

  function getActForFloor(floor) {
    return ACTS.find((act) => floor >= act.floorRange[0] && floor <= act.floorRange[1]) || ACTS[0];
  }

  function getFloorRules(floor = state.floor) {
    return FLOOR_RULES[floor] || FLOOR_RULES[CONFIG.maxFloors];
  }

  function getEnemyPoolForFloor(floor) {
    const act = getActForFloor(floor);
    const pool = ENEMY_POOLS_BY_ACT[act.enemyPool];
    return pool?.byFloor?.[floor] || pool?.default || [];
  }

  function getArtifactPoolForFloor(floor, cursed) {
    const act = getActForFloor(floor);
    const pool = ARTIFACT_POOLS_BY_ACT[act.artifactPool];
    const ids = cursed ? pool?.cursed : pool?.clean;
    const artifacts = (ids || []).map(artifactById).filter(Boolean);
    return artifacts.length ? artifacts : ARTIFACTS.filter((artifact) => artifact.cursed === cursed);
  }

  function chooseArtifact(cursed) {
    const pool = getArtifactPoolForFloor(state.floor, cursed);
    const uncollected = pool.filter((artifact) =>
      !state.player.artifacts.some((owned) => owned.id === artifact.id)
    );
    return sample(uncollected.length ? uncollected : pool);
  }

  function addLog(message) {
    state.logs.push(message);
    state.logs = state.logs.slice(-CONFIG.logLimit);
    updateUI();
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode !== MODES.PLAYING) {
      state.upgradeMode = false;
      state.evolutionChoiceSpellId = null;
      state.evolutionChoiceSlotIndex = null;
    }
    updateOverlay();
    updateUI();
  }

  function createPlayer() {
    return {
      x: 0,
      y: 0,
      hp: CONFIG.basePlayer.hp,
      maxHp: CONFIG.basePlayer.maxHp,
      mana: CONFIG.basePlayer.mana,
      maxMana: CONFIG.basePlayer.maxMana,
      shield: 0,
      staffDamage: CONFIG.basePlayer.staffDamage,
      spells: ["fireball"],
      spellLevels: { fireball: 1 },
      spellEvolutions: {},
      magicShards: 0,
      claimedMagicShardRewards: {},
      selectedSpell: 0,
      flatSpellBonus: 0,
      spellDamageMultiplier: 1,
      spellCostModifier: 0,
      elementBonus: {},
      manaRegenEvery: CONFIG.manaRegenEvery,
      blocksFirstHit: false,
      floorBlockAvailable: false,
      revealsSecrets: false,
      freeFirstSpell: false,
      freeSpellAvailable: false,
      poisonBonusTurns: 0,
      lightHealBonus: 0,
      shadowWoundBonus: 0,
      earthShieldBonus: 0,
      windPushBonus: 0,
      damageReduction: 0,
      damageReductionTurns: 0,
      visionBonus: 0,
      artifacts: [],
      trait: null,
    };
  }

  function newGame() {
    state.floor = 1;
    state.turn = 0;
    state.logs = [];
    state.enemies = [];
    state.objects = [];
    state.hazards = [];
    state.barriers = [];
    state.effects = [];
    state.visible = [];
    state.explored = [];
    state.selectedSpellIndex = 0;
    state.upgradeMode = false;
    state.evolutionChoiceSpellId = null;
    state.evolutionChoiceSlotIndex = null;
    state.pendingManaRefund = 0;
    state.lastMoveDir = { x: 1, y: 0 };
    state.player = createPlayer();

    const trait = sample(TRAITS);
    state.player.trait = trait;
    trait.apply(state.player);

    addLog("Вы вошли в Башню последнего мага.");
    addLog(`Ваш трейт: ${trait.name}.`);
    startFloor(1);
    setMode(MODES.PLAYING);
  }

  function startFloor(floor) {
    state.floor = floor;
    state.enemies = [];
    state.objects = [];
    state.hazards = [];
    state.barriers = [];
    state.effects = [];
    const floorData = generateFloor(floor);
    state.map = floorData.map;
    state.rooms = floorData.rooms;
    state.visible = createFlagMap(false);
    state.explored = createFlagMap(false);
    state.player.x = floorData.start.x;
    state.player.y = floorData.start.y;
    state.player.floorBlockAvailable = state.player.blocksFirstHit;
    state.player.freeSpellAvailable = state.player.freeFirstSpell;
    state.player.mana = Math.min(state.player.maxMana, state.player.mana + REWARD_RULES.floorManaRestore);
    placeFloorContent(floorData);
    updateVision();
    if (floor === 1) {
      addLog("Первый этаж башни складывается из камня и тени.");
    } else {
      const bossType = BOSSES_BY_FLOOR[floor];
      addLog(bossType ? `${ENEMY_TYPES[bossType].name} пробуждается.` : `Вы поднимаетесь на этаж ${floor}.`);
    }
    grantFloorMagicShardReward(floor);
    updateUI();
  }

  function createEmptyMap() {
    return Array.from({ length: CONFIG.mapHeight }, () =>
      Array.from({ length: CONFIG.mapWidth }, () => TILES.WALL)
    );
  }

  function carveRoom(map, room) {
    for (let y = room.y; y < room.y + room.h; y += 1) {
      for (let x = room.x; x < room.x + room.w; x += 1) {
        map[y][x] = TILES.FLOOR;
      }
    }
  }

  function carveCorridor(map, from, to) {
    let x = from.x;
    let y = from.y;
    const carve = () => {
      if (x > 0 && y > 0 && x < CONFIG.mapWidth - 1 && y < CONFIG.mapHeight - 1) {
        map[y][x] = TILES.CORRIDOR;
      }
    };

    carve();
    if (Math.random() < 0.5) {
      while (x !== to.x) {
        x += Math.sign(to.x - x);
        carve();
      }
      while (y !== to.y) {
        y += Math.sign(to.y - y);
        carve();
      }
    } else {
      while (y !== to.y) {
        y += Math.sign(to.y - y);
        carve();
      }
      while (x !== to.x) {
        x += Math.sign(to.x - x);
        carve();
      }
    }
  }

  function roomsOverlap(a, b) {
    return (
      a.x - 1 < b.x + b.w + 1 &&
      a.x + a.w + 1 > b.x - 1 &&
      a.y - 1 < b.y + b.h + 1 &&
      a.y + a.h + 1 > b.y - 1
    );
  }

  function roomCenter(room) {
    return {
      x: Math.floor(room.x + room.w / 2),
      y: Math.floor(room.y + room.h / 2),
    };
  }

  function generateFloor(floor) {
    const rules = getFloorRules(floor);
    for (let rebuild = 0; rebuild < 20; rebuild += 1) {
      const map = createEmptyMap();
      const rooms = [];
      const targetRooms = rules.targetRooms;
      const maxRoomSize = rules.maxRoomSize;

      // Комнаты и коридоры создают гарантированно связный граф: каждая новая комната соединяется с предыдущей.
      for (let attempt = 0; attempt < CONFIG.roomAttempts && rooms.length < targetRooms; attempt += 1) {
        const room = {
          w: randomInt(5, maxRoomSize),
          h: randomInt(4, rules.maxRoomHeight),
          x: randomInt(1, CONFIG.mapWidth - maxRoomSize - 2),
          y: randomInt(1, CONFIG.mapHeight - 8),
        };
        if (rooms.some((existing) => roomsOverlap(room, existing))) {
          continue;
        }
        carveRoom(map, room);
        if (rooms.length > 0) {
          carveCorridor(map, roomCenter(rooms[rooms.length - 1]), roomCenter(room));
        }
        rooms.push(room);
      }

      if (rooms.length >= 6) {
        const startRoom = rooms[0];
        const start = roomCenter(startRoom);
        const exitRoom = rooms
          .slice(1)
          .sort((a, b) => distance(roomCenter(b), start) - distance(roomCenter(a), start))[0];
        return {
          map,
          rooms,
          startRoom,
          exitRoom,
          start,
          exit: roomCenter(exitRoom),
        };
      }
    }

    throw new Error("Не удалось сгенерировать этаж.");
  }

  function placeFloorContent(floorData) {
    const rules = getFloorRules();
    if (rules.stairs) {
      state.objects.push({
        id: nextId(),
        type: EVENT_TYPES.STAIRS,
        x: floorData.exit.x,
        y: floorData.exit.y,
      });
    }

    placeBoss(floorData);
    placeEnemies(floorData, rules);
    placeResources(floorData, rules);
    if (rules.firstFloorBooks) {
      placeFirstFloorBooks(floorData);
    }
    if (rules.trapCount > 0) {
      placeTraps(floorData, rules);
    }
    placeArtifacts(floorData, rules);
  }

  function placeBoss(floorData) {
    const bossType = BOSSES_BY_FLOOR[state.floor];
    if (!bossType) {
      return;
    }
    state.enemies.push(createEnemy(bossType, floorData.exit.x, floorData.exit.y, state.floor));
  }

  function placeEnemies(floorData, rules = getFloorRules()) {
    if (rules.enemyCount <= 0) {
      return;
    }
    const enemyPool = getEnemyPoolForFloor(state.floor);
    if (!enemyPool.length) {
      return;
    }
    for (let i = 0; i < rules.enemyCount; i += 1) {
      const room = sample(floorData.rooms.slice(1));
      const pos = randomFreeCellInRoom(room);
      if (!pos || distance(pos, floorData.start) < rules.minEnemyDistanceFromStart) {
        continue;
      }
      const enemyType = sample(enemyPool);
      state.enemies.push(createEnemy(enemyType, pos.x, pos.y, state.floor));
    }
  }

  function placeResources(floorData, rules = getFloorRules()) {
    const rooms = floorData.rooms.filter((room) => room !== floorData.startRoom && room !== floorData.exitRoom);
    const amount = rules.resourceCount;
    for (let i = 0; i < amount; i += 1) {
      const room = rooms[i % rooms.length] || sample(floorData.rooms);
      const pos = randomFreeCellInRoom(room);
      if (!pos) {
        continue;
      }
      state.objects.push({
        id: nextId(),
        type: i % 2 === 0 ? EVENT_TYPES.CHEST : EVENT_TYPES.ALTAR,
        x: pos.x,
        y: pos.y,
        used: false,
      });
    }
  }

  function placeArtifacts(floorData, rules = getFloorRules()) {
    const rooms = floorData.rooms.filter((room) => room !== floorData.startRoom && room !== floorData.exitRoom);
    const availableRooms = [...(rooms.length ? rooms : floorData.rooms.slice(1))];
    const amount = rules.artifactCount + (Math.random() < rules.bonusArtifactChance ? 1 : 0);

    for (let i = 0; i < amount; i += 1) {
      const room = availableRooms.length
        ? availableRooms.splice(randomInt(0, availableRooms.length - 1), 1)[0]
        : sample(rooms.length ? rooms : floorData.rooms);
      const pos = randomFreeCellInRoom(room);
      if (!pos) {
        continue;
      }
      const artifact = chooseArtifact(Math.random() < rules.cursedArtifactChance);
      state.objects.push({
        id: nextId(),
        type: EVENT_TYPES.ARTIFACT,
        artifactId: artifact.id,
        x: pos.x,
        y: pos.y,
      });
    }
  }

  function placeTraps(floorData, rules = getFloorRules()) {
    for (let i = 0; i < rules.trapCount; i += 1) {
      const room = sample(floorData.rooms.slice(1));
      const pos = randomFreeCellInRoom(room);
      if (!pos) {
        continue;
      }
      state.objects.push({
        id: nextId(),
        type: EVENT_TYPES.TRAP,
        x: pos.x,
        y: pos.y,
        armed: true,
      });
    }
  }

  function chooseFirstFloorBooks() {
    const trait = state.player.trait;
    const chosen = [];
    if (trait && trait.type === "elemental" && trait.element !== "fire") {
      chosen.push(REWARD_RULES.elementalTraitBooks[trait.element]);
    }
    while (chosen.length < REWARD_RULES.firstFloorBookCount) {
      const spellId = sample(REWARD_RULES.bookSpellPool);
      if (!chosen.includes(spellId)) {
        chosen.push(spellId);
      }
    }
    return chosen;
  }

  function placeFirstFloorBooks(floorData) {
    const spells = chooseFirstFloorBooks();
    const sideRooms = floorData.rooms.filter((room) => room !== floorData.startRoom && room !== floorData.exitRoom);
    spells.forEach((spellId, index) => {
      const room = sideRooms[index % sideRooms.length] || floorData.rooms[index + 1] || floorData.startRoom;
      const pos = randomFreeCellInRoom(room);
      if (!pos) {
        return;
      }
      state.objects.push({
        id: nextId(),
        type: EVENT_TYPES.BOOK,
        spellId,
        x: pos.x,
        y: pos.y,
        used: false,
      });
    });
  }

  function randomFreeCellInRoom(room) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const x = randomInt(room.x + 1, room.x + room.w - 2);
      const y = randomInt(room.y + 1, room.y + room.h - 2);
      if (isFreeCell(x, y)) {
        return { x, y };
      }
    }
    return null;
  }

  function createEnemy(type, x, y, floor, overrides = {}) {
    const template = ENEMY_TYPES[type];
    const fixedPower = template.boss || template.summoned || template.illusion || template.object;
    const scale = fixedPower ? 0 : Math.max(0, floor - 1);
    const hp = overrides.hp ?? template.hp + scale;
    const damage = overrides.damage ?? template.damage + Math.floor(scale / 2);
    return {
      id: nextId(),
      type,
      name: template.name,
      glyph: template.glyph,
      color: template.color,
      x,
      y,
      hp,
      maxHp: overrides.maxHp ?? hp,
      damage,
      speed: template.speed,
      range: template.range,
      ranged: Boolean(template.ranged),
      boss: Boolean(template.boss),
      summoned: Boolean(template.summoned),
      minion: Boolean(template.minion),
      illusion: Boolean(template.illusion),
      object: Boolean(template.object),
      summonerId: null,
      lifetime: template.lifetime || 0,
      phase: 0,
      nextAttackBonus: 0,
      resistElement: null,
      resistTurns: 0,
      shardCooldown: 0,
      attackText: template.attackText || "",
      defeatText: template.defeatText || "",
      weakTo: template.weakTo || [],
      tags: template.tags || [],
      slow: 0,
      stun: 0,
      burn: 0,
      poison: 0,
      acidTurns: 0,
      acidBonus: 0,
      curseMarkTurns: 0,
      curseMarkHits: 0,
      curseMarkBonus: 0,
      skipCounter: 0,
      bossTimer: 0,
      ...overrides,
    };
  }

  function isInside(x, y) {
    return x >= 0 && y >= 0 && x < CONFIG.mapWidth && y < CONFIG.mapHeight;
  }

  function isWalkable(x, y) {
    return isInside(x, y) && state.map[y][x] !== TILES.WALL;
  }

  function isVisibleCell(x, y) {
    return isInside(x, y) && Boolean(state.visible[y]?.[x]);
  }

  function isExploredCell(x, y) {
    return isInside(x, y) && Boolean(state.explored[y]?.[x]);
  }

  function roomAt(x, y) {
    return state.rooms.find((room) =>
      x >= room.x && x < room.x + room.w &&
      y >= room.y && y < room.y + room.h
    ) || null;
  }

  function markVisible(x, y) {
    if (!isInside(x, y)) {
      return;
    }
    state.visible[y][x] = true;
    state.explored[y][x] = true;
  }

  function revealRoom(room) {
    for (let y = room.y - 1; y <= room.y + room.h; y += 1) {
      for (let x = room.x - 1; x <= room.x + room.w; x += 1) {
        markVisible(x, y);
      }
    }
  }

  function revealReachableRadius(center, radius) {
    const queue = [{ x: center.x, y: center.y, steps: 0 }];
    const visited = new Set([`${center.x},${center.y}`]);

    while (queue.length) {
      const cell = queue.shift();
      markVisible(cell.x, cell.y);
      getAdjacentCells(cell.x, cell.y).forEach((adjacent) => {
        if (!isWalkable(adjacent.x, adjacent.y)) {
          markVisible(adjacent.x, adjacent.y);
        }
      });

      if (cell.steps >= radius) {
        continue;
      }

      getAdjacentCells(cell.x, cell.y).forEach((adjacent) => {
        const key = `${adjacent.x},${adjacent.y}`;
        if (!visited.has(key) && isWalkable(adjacent.x, adjacent.y)) {
          visited.add(key);
          queue.push({ x: adjacent.x, y: adjacent.y, steps: cell.steps + 1 });
        }
      });
    }
  }

  function updateVision() {
    if (!state.player || !state.map.length) {
      return;
    }
    state.visible = createFlagMap(false);
    if (!state.explored.length) {
      state.explored = createFlagMap(false);
    }

    const radius = clamp(3 + state.player.visionBonus, 2, 7);
    const currentRoom = roomAt(state.player.x, state.player.y);
    if (currentRoom) {
      revealRoom(currentRoom);
    }
    revealReachableRadius(state.player, radius);
  }

  function objectAt(x, y, types = null) {
    return state.objects.find((object) => {
      if (object.x !== x || object.y !== y) {
        return false;
      }
      return !types || types.includes(object.type);
    });
  }

  function enemyAt(x, y) {
    return state.enemies.find((enemy) => enemy.x === x && enemy.y === y && enemy.hp > 0);
  }

  function barrierAt(x, y) {
    return state.barriers.find((barrier) => barrier.x === x && barrier.y === y && barrier.turns > 0);
  }

  function isFreeCell(x, y) {
    return isWalkable(x, y) &&
      !barrierAt(x, y) &&
      !enemyAt(x, y) &&
      !objectAt(x, y) &&
      !(state.player && state.player.x === x && state.player.y === y);
  }

  function getActiveSummonsForBoss(boss, filter = () => true) {
    return state.enemies.filter((enemy) =>
      enemy.hp > 0 &&
      enemy.summoned &&
      enemy.summonerId === boss.id &&
      filter(enemy)
    );
  }

  function canBossSummon(boss, filter, limit) {
    return getActiveSummonsForBoss(boss, filter).length < limit;
  }

  function sameCell(a, b) {
    return Boolean(a && b && a.x === b.x && a.y === b.y);
  }

  function wouldLeavePlayerEscape(candidateCell = null, movingEnemy = null) {
    if (!state.player) {
      return false;
    }
    const exits = getAdjacentCells(state.player.x, state.player.y).filter((cell) => {
      if (!isWalkable(cell.x, cell.y)) {
        return false;
      }
      if (sameCell(cell, candidateCell)) {
        return false;
      }
      const occupant = enemyAt(cell.x, cell.y);
      return !occupant || occupant.id === movingEnemy?.id;
    });
    return exits.length === 0;
  }

  function cellsWithinDistance(center, maxDistance) {
    const cells = [];
    for (let y = center.y - maxDistance; y <= center.y + maxDistance; y += 1) {
      for (let x = center.x - maxDistance; x <= center.x + maxDistance; x += 1) {
        const cell = { x, y };
        if (isInside(x, y) && distance(cell, center) > 0 && distance(cell, center) <= maxDistance) {
          cells.push(cell);
        }
      }
    }
    return cells;
  }

  function findSafeBossSpawnCell(boss, options = {}) {
    const maxDistance = options.maxDistance || 3;
    const minPlayerDistance = options.minPlayerDistance || 1;
    const centers = options.includePlayerSide ? [boss, state.player] : [boss];
    const candidates = [];

    centers.forEach((center) => {
      cellsWithinDistance(center, maxDistance).forEach((cell) => {
        if (candidates.some((existing) => sameCell(existing, cell))) {
          return;
        }
        candidates.push(cell);
      });
    });

    const safe = candidates.filter((cell) =>
      isFreeCell(cell.x, cell.y) &&
      distance(cell, state.player) >= minPlayerDistance &&
      !wouldLeavePlayerEscape(cell)
    );
    return safe.length ? sample(safe) : null;
  }

  function toggleUpgradeMode() {
    state.upgradeMode = !state.upgradeMode;
    clearEvolutionChoice();
    addLog(state.upgradeMode
      ? "Режим улучшений: нажмите 1-3, чтобы усилить или эволюционировать заклинание."
      : "Режим улучшений закрыт.");
  }

  function clearEvolutionChoice() {
    state.evolutionChoiceSpellId = null;
    state.evolutionChoiceSlotIndex = null;
  }

  function upgradeSpellInSlot(index) {
    const spellId = state.player.spells[index];
    if (!spellId) {
      addLog("В этом слоте нет заклинания для улучшения.");
      return;
    }

    const spell = SPELLS[spellId];
    const level = spellLevel(spellId);
    if (level >= MAX_SPELL_LEVEL) {
      openEvolutionChoice(index, spellId);
      return;
    }

    const upgrade = nextSpellUpgrade(spellId);
    if (!upgrade) {
      addLog(`${spell.name} пока нельзя улучшить дальше.`);
      return;
    }

    if (state.player.magicShards < upgrade.cost) {
      addLog(`Не хватает осколков магии: нужно ${upgrade.cost}.`);
      return;
    }

    state.player.magicShards -= upgrade.cost;
    state.player.spellLevels[spellId] = level + 1;
    clearEvolutionChoice();
    addLog(`${spell.name} усилено до уровня ${level + 1}: ${upgrade.text}.`);
  }

  function openEvolutionChoice(index, spellId) {
    const spell = SPELLS[spellId];
    const level = spellLevel(spellId);
    const options = evolutionOptions(spellId);
    const currentEvolution = spellEvolution(spellId);

    if (level < MAX_SPELL_LEVEL) {
      addLog(`${spell.name} сначала нужно усилить до 3 уровня.`);
      return;
    }

    if (currentEvolution) {
      addLog(`${spell.name} уже эволюционировало: ${currentEvolution.name}.`);
      clearEvolutionChoice();
      return;
    }

    if (!options.length) {
      addLog(`${spell.name} пока не имеет веток эволюции.`);
      clearEvolutionChoice();
      return;
    }

    if (state.player.magicShards < EVOLUTION_COST) {
      addLog(`Не хватает осколков магии для эволюции: нужно ${EVOLUTION_COST}.`);
      clearEvolutionChoice();
      return;
    }

    state.evolutionChoiceSpellId = spellId;
    state.evolutionChoiceSlotIndex = index;
    addLog(`Выберите эволюцию для ${spell.name}: 1 - ${options[0].name}, 2 - ${options[1].name}, 3 - отмена.`);
    updateUI();
  }

  function chooseEvolutionBranch(choiceIndex) {
    const spellId = state.evolutionChoiceSpellId;
    if (!spellId) {
      return;
    }

    if (choiceIndex === 2) {
      const spell = SPELLS[spellId];
      clearEvolutionChoice();
      addLog(`Выбор эволюции для ${spell.name} отменен.`);
      return;
    }

    const spell = SPELLS[spellId];
    const branch = evolutionOptions(spellId)[choiceIndex];
    if (!branch) {
      addLog("Выберите ветку 1 или 2.");
      return;
    }

    if (spellLevel(spellId) < MAX_SPELL_LEVEL) {
      clearEvolutionChoice();
      addLog(`${spell.name} сначала нужно усилить до 3 уровня.`);
      return;
    }

    if (hasEvolution(spellId)) {
      const currentEvolution = spellEvolution(spellId);
      clearEvolutionChoice();
      addLog(`${spell.name} уже эволюционировало: ${currentEvolution.name}.`);
      return;
    }

    if (state.player.magicShards < EVOLUTION_COST) {
      clearEvolutionChoice();
      addLog(`Не хватает осколков магии для эволюции: нужно ${EVOLUTION_COST}.`);
      return;
    }

    state.player.magicShards -= EVOLUTION_COST;
    state.player.spellEvolutions[spellId] = branch.id;
    clearEvolutionChoice();
    addLog(`${spell.name} эволюционирует: ${branch.name}. ${branch.logText}`);
    updateUI();
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

  function tryMovePlayer(dx, dy) {
    const target = { x: state.player.x + dx, y: state.player.y + dy };
    state.lastMoveDir = { x: dx, y: dy };
    if (!isWalkable(target.x, target.y)) {
      addLog("Каменная стена не поддается.");
      return;
    }
    if (barrierAt(target.x, target.y)) {
      addLog("Земная преграда держит проход.");
      return;
    }

    const enemy = enemyAt(target.x, target.y);
    if (enemy) {
      damageEnemy(enemy, state.player.staffDamage, "посох");
      advanceTurn();
      return;
    }

    state.player.x = target.x;
    state.player.y = target.y;
    const trap = objectAt(target.x, target.y, [EVENT_TYPES.TRAP]);
    if (trap && trap.armed) {
      trap.armed = false;
      damagePlayer(2, "Ловушка вспыхивает под ногами.");
    }
    advanceTurn();
  }

  function interact() {
    const here = objectAt(state.player.x, state.player.y);
    const adjacent = getAdjacentCells(state.player.x, state.player.y)
      .map((cell) => objectAt(cell.x, cell.y))
      .find((object) => object && object.type !== EVENT_TYPES.TRAP);
    const target = here && here.type !== EVENT_TYPES.TRAP ? here : adjacent;

    if (!target) {
      addLog("Здесь не с чем взаимодействовать.");
      return;
    }

    if (target.type === EVENT_TYPES.STAIRS) {
      startFloor(state.floor + 1);
      advanceTurn(false);
      return;
    }

    if (target.type === EVENT_TYPES.BOOK) {
      learnBook(target);
      advanceTurn();
      return;
    }

    if (target.type === EVENT_TYPES.ARTIFACT) {
      collectArtifact(target);
      advanceTurn();
      return;
    }

    if (target.type === EVENT_TYPES.CHEST) {
      if (target.used) {
        addLog("Сундук уже пуст.");
        return;
      }
      target.used = true;
      state.player.mana = Math.min(state.player.maxMana, state.player.mana + REWARD_RULES.chestMana);
      addLog("В сундуке мерцает кристалл: +3 маны.");
      advanceTurn();
      return;
    }

    if (target.type === EVENT_TYPES.ALTAR) {
      if (target.used) {
        addLog("Алтарь уже погас.");
        return;
      }
      target.used = true;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + REWARD_RULES.altarHeal);
      addLog("Алтарь восстанавливает 3 здоровья.");
      advanceTurn();
      return;
    }

    addLog("Объект молчит.");
  }

  function applyArtifact(artifact, player = state.player) {
    artifact.apply(player);
  }

  function collectArtifact(object) {
    const artifact = artifactById(object.artifactId);
    if (!artifact) {
      addLog("Артефакт рассыпается, не оставив следа.");
      state.objects = state.objects.filter((item) => item.id !== object.id);
      return;
    }

    applyArtifact(artifact);
    state.player.artifacts.push({
      id: artifact.id,
      name: artifact.name,
      bonusText: artifact.bonusText,
      curseText: artifact.curseText || "",
      cursed: artifact.cursed,
    });
    state.objects = state.objects.filter((item) => item.id !== object.id);
    addLog(`${artifact.cursed ? "Проклятый артефакт" : "Артефакт"}: ${artifact.name}. ${artifact.bonusText}`);
    if (artifact.cursed) {
      addLog(`Проклятие раскрыто: ${artifact.curseText}`);
    }
    updateVision();
  }

  function learnBook(book) {
    const spell = SPELLS[book.spellId];
    addLog(`Найдена книга: ${spell.name}.`);
    if (state.player.spells.includes(book.spellId)) {
      addLog("Вы уже знаете это заклинание.");
    } else if (state.player.spells.length >= REWARD_RULES.maxKnownSpells) {
      addLog("Можно держать только 3 активных заклинания.");
    } else {
      state.player.spells.push(book.spellId);
      state.player.spellLevels[book.spellId] = SPELLS[book.spellId].level;
      addLog("Вы изучили новое заклинание.");
    }
    state.objects = state.objects.filter((object) => object.id !== book.id);
  }

  function castSelectedSpell() {
    const spellId = state.player.spells[state.selectedSpellIndex];
    if (!spellId) {
      addLog("В этом слоте нет заклинания.");
      return;
    }
    const spell = SPELLS[spellId];
    const isFree = state.player.freeSpellAvailable;
    const cost = spellCost(spell);
    if (!isFree && state.player.mana < cost) {
      addLog("Не хватает маны.");
      return;
    }

    // Общий вход для заклинаний держит цену, лог и передачу хода в одном месте.
    state.pendingManaRefund = 0;
    const acted = castSpell(spell);
    if (acted) {
      if (!isFree) {
        state.player.mana -= cost;
      } else {
        state.player.freeSpellAvailable = false;
        addLog("Экономный колдун сохраняет ману.");
      }
      if (state.pendingManaRefund > 0) {
        const refund = state.pendingManaRefund;
        state.player.mana = Math.min(state.player.maxMana, state.player.mana + refund);
        addLog(`Эволюция возвращает ${refund} маны.`);
      }
      state.pendingManaRefund = 0;
      addEffect(state.player.x, state.player.y, ELEMENT_COLORS[spell.element], 5, spell.name);
      advanceTurn();
    }
  }

  function applyOverloadStun(enemy, evolution) {
    if (evolution?.id !== "overload" || !state.enemies.includes(enemy)) {
      return;
    }
    if (Math.random() < evolution.stunChance) {
      enemy.stun = Math.max(enemy.stun, evolution.stunTurns);
      addLog(`${enemy.name} оглушен перегрузкой.`);
      addEffect(enemy.x, enemy.y, ELEMENT_COLORS.lightning, 7, "!");
    }
  }

  function castChainLightningSpell(spell, evolution) {
    const first = nearestEnemy(spell.range);
    if (!first) {
      addLog("Молния не нашла цель.");
      return false;
    }

    damageEnemy(first, spellDamage(spell, first), spell.name, spell.element);
    applyOverloadStun(first, evolution);
    addEffect(first.x, first.y, ELEMENT_COLORS.lightning, 8, "молния");

    let jumpSource = first;
    const hitIds = new Set([first.id]);
    const baseJumps = spellUpgradeOverride(spell.id, "chainJumps", 1);
    const maxJumps = evolution?.id === "overload"
      ? evolution.maxJumps
      : baseJumps + (evolution?.id === "stormChain" ? evolution.jumpBonus : 0);
    const jumpRange = evolution?.jumpRange || 4;

    for (let jump = 1; jump <= maxJumps; jump += 1) {
      const next = state.enemies
        .filter((enemy) =>
          enemy.hp > 0 &&
          !hitIds.has(enemy.id) &&
          isVisibleCell(enemy.x, enemy.y) &&
          distance(enemy, jumpSource) <= jumpRange
        )
        .sort((a, b) => distance(a, jumpSource) - distance(b, jumpSource))[0];
      if (!next) {
        break;
      }
      hitIds.add(next.id);
      damageEnemy(next, Math.max(1, spellDamage(spell, next) - jump), "скачок молнии", spell.element);
      applyOverloadStun(next, evolution);
      addEffect(next.x, next.y, ELEMENT_COLORS.lightning, 8, "молния");
      jumpSource = next;
    }
    return true;
  }

  function placeEarthBastion(evolution) {
    const placed = [];
    const preferredDirections = nearbyEnemies(state.player, 8)
      .map((enemy) => {
        const dx = enemy.x - state.player.x;
        const dy = enemy.y - state.player.y;
        return Math.abs(dx) >= Math.abs(dy)
          ? { x: Math.sign(dx), y: 0 }
          : { x: 0, y: Math.sign(dy) };
      });
    const fallback = state.lastMoveDir.x || state.lastMoveDir.y ? state.lastMoveDir : { x: 1, y: 0 };
    const directions = [...preferredDirections, fallback, { x: -fallback.y, y: fallback.x }, { x: fallback.y, y: -fallback.x }];
    const candidates = [];

    directions.forEach((dir) => {
      for (let step = 1; step <= 2; step += 1) {
        const base = { x: state.player.x + dir.x * step, y: state.player.y + dir.y * step };
        const sideA = { x: base.x - dir.y, y: base.y + dir.x };
        const sideB = { x: base.x + dir.y, y: base.y - dir.x };
        [base, sideA, sideB].forEach((cell) => {
          if (!candidates.some((existing) => sameCell(existing, cell))) {
            candidates.push(cell);
          }
        });
      }
    });

    candidates.forEach((cell) => {
      if (
        placed.length >= evolution.barrierCount ||
        !isFreeCell(cell.x, cell.y) ||
        wouldLeavePlayerEscape(cell)
      ) {
        return;
      }
      const barrier = {
        id: nextId(),
        x: cell.x,
        y: cell.y,
        turns: evolution.barrierTurns,
      };
      state.barriers.push(barrier);
      placed.push(barrier);
      addEffect(cell.x, cell.y, ELEMENT_COLORS.earth, 8, "кам");
    });

    return placed.length;
  }

  function tryWindStep(evolution) {
    const dir = state.lastMoveDir.x || state.lastMoveDir.y ? state.lastMoveDir : { x: 1, y: 0 };
    let moved = 0;
    for (let step = 0; step < evolution.steps; step += 1) {
      const next = { x: state.player.x + dir.x, y: state.player.y + dir.y };
      if (
        !isWalkable(next.x, next.y) ||
        barrierAt(next.x, next.y) ||
        enemyAt(next.x, next.y) ||
        objectAt(next.x, next.y)
      ) {
        break;
      }
      state.player.x = next.x;
      state.player.y = next.y;
      moved += 1;
      addEffect(next.x, next.y, ELEMENT_COLORS.wind, 6, "вет");
    }
    if (moved > 0) {
      updateVision();
    }
    return moved;
  }

  function castSpell(spell) {
    const evolution = spellEvolution(spell.id);

    if (spell.id === "stoneArmor") {
      const amount = 3 +
        state.player.earthShieldBonus +
        spellUpgradeTotal(spell.id, "shieldBonus") +
        (evolution?.shieldBonus || 0);
      state.player.shield += amount;

      if (evolution?.id === "graniteCarapace") {
        state.player.damageReduction = Math.max(state.player.damageReduction, evolution.reduction);
        state.player.damageReductionTurns = Math.max(state.player.damageReductionTurns, evolution.reductionTurns);
        addLog(`Гранитный панцирь дает ${amount} щита и снижает входящий урон.`);
      } else if (evolution?.id === "earthBastion") {
        const barriers = placeEarthBastion(evolution);
        addLog(`Земной бастион дает ${amount} щита и поднимает преграды: ${barriers}.`);
      } else {
        addLog(`Каменная броня дает ${amount} щита.`);
      }
      return true;
    }

    if (spell.id === "windGust") {
      if (evolution?.id === "windStep") {
        const moved = tryWindStep(evolution);
        state.player.shield += evolution.shield;
        addLog(`Шаг ветра переносит мага на ${moved} кл. и дает ${evolution.shield} щита.`);
        return true;
      }

      const range = spell.range + (evolution?.id === "hurricaneWall" ? evolution.rangeBonus : 0);
      const targets = state.enemies.filter((enemy) =>
        enemy.hp > 0 &&
        isVisibleCell(enemy.x, enemy.y) &&
        distance(enemy, state.player) <= range
      );
      if (!targets.length) {
        addLog("Порыву ветра некого оттолкнуть.");
        return false;
      }
      targets.forEach((enemy) => {
        const died = damageEnemy(enemy, spellDamage(spell, enemy), spell.name, spell.element);
        if (died || !state.enemies.includes(enemy)) {
          return;
        }
        const pushSteps = 2 + state.player.windPushBonus + (evolution?.id === "hurricaneWall" ? evolution.pushBonus : 0);
        const pushResult = pushEnemy(enemy, pushSteps);
        const collisionDamage = spellUpgradeTotal(spell.id, "collisionDamage") +
          (evolution?.id === "hurricaneWall" ? evolution.collisionDamageBonus : 0);
        if (collisionDamage > 0 && pushResult.blocked && state.enemies.includes(enemy)) {
          damageEnemy(enemy, collisionDamage, "столкновение с преградой", spell.element);
        }
      });
      return true;
    }

    if (spell.id === "poisonCloud") {
      const target = nearestEnemy(spell.range);
      const center = target || {
        x: state.player.x + state.lastMoveDir.x * Math.min(3, spell.range),
        y: state.player.y + state.lastMoveDir.y * Math.min(3, spell.range),
      };
      const safeCenter = isWalkable(center.x, center.y) && !barrierAt(center.x, center.y)
        ? center
        : { x: state.player.x, y: state.player.y };
      const hazard = {
        id: nextId(),
        type: evolution?.id === "acidMist" ? "acid" : "poison",
        x: safeCenter.x,
        y: safeCenter.y,
        radius: 1,
        turns: 3 + state.player.poisonBonusTurns + spellUpgradeTotal(spell.id, "hazardTurnsBonus"),
        damage: spellUpgradeOverride(spell.id, "hazardDamage", 1),
        label: evolution?.id === "acidMist" ? "кислотный туман" : "ядовитое облако",
      };
      if (evolution?.id === "plagueCloud") {
        hazard.spreadOnDeath = true;
        hazard.spreadTurns = evolution.spreadTurns;
      }
      if (evolution?.id === "acidMist") {
        hazard.acidTurns = evolution.acidTurns;
        hazard.acidBonus = evolution.acidBonus;
      }
      state.hazards.push(hazard);
      addLog(evolution?.id === "acidMist"
        ? "Кислотный туман расползается по плитам."
        : "Ядовитое облако расползается по плитам.");
      addEffect(safeCenter.x, safeCenter.y, ELEMENT_COLORS.poison, 8, evolution?.id === "acidMist" ? "кис" : "яд");
      return true;
    }

    if (spell.id === "chainLightning") {
      return castChainLightningSpell(spell, evolution);
    }

    if (spell.id === "dawnRay" && evolution?.id === "holyCircle") {
      const targets = nearbyEnemies(state.player, evolution.radius);
      let kills = 0;
      targets.forEach((enemy) => {
        const damage = Math.max(1, spellDamage(spell, enemy) - evolution.damagePenalty);
        if (damageEnemy(enemy, damage, evolution.name, spell.element)) {
          kills += 1;
        }
        addEffect(enemy.x, enemy.y, ELEMENT_COLORS.light, 8, "свет");
      });
      const heal = evolution.heal + state.player.lightHealBonus + spellUpgradeTotal(spell.id, "healBonus") + kills;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
      state.player.shield += evolution.shield;
      addLog(`Священный круг лечит ${heal} здоровья и дает ${evolution.shield} щита.`);
      return true;
    }

    if (spell.id === "dawnRay" && evolution?.id === "dawnSpear") {
      const targets = enemiesOnLine(spell.range);
      if (!targets.length) {
        addLog("Копье зари не нашло цель на линии.");
        return false;
      }
      let kills = 0;
      targets.forEach((enemy) => {
        let damage = spellDamage(spell, enemy) + evolution.damageBonus;
        if (enemy.tags.includes("undead")) {
          damage += spellUpgradeOverride(spell.id, "undeadBonus", 2);
        }
        if (damageEnemy(enemy, damage, evolution.name, spell.element)) {
          kills += 1;
        }
        addEffect(enemy.x, enemy.y, ELEMENT_COLORS.light, 8, "коп");
      });
      const heal = 1 + state.player.lightHealBonus + spellUpgradeTotal(spell.id, "healBonus") + kills;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
      addLog(`Копье зари лечит ${heal} здоровья.`);
      return true;
    }

    const target = spell.id === "shadowSpike" && evolution?.id === "twilightBlade"
      ? nearestWoundedEnemy(spell.range) || firstEnemyOnLine(spell.range) || nearestEnemy(spell.range)
      : firstEnemyOnLine(spell.range) || nearestEnemy(spell.range);
    if (!target) {
      addLog(`${spell.name}: нет цели в пределах действия.`);
      return false;
    }

    let damage = spellDamage(spell, target);
    if (spell.id === "fireball" && evolution?.id === "solarMeteor") {
      damage += evolution.damageBonus;
      if (target.burn > 0) {
        target.burn = 0;
        damage += evolution.burnConsumeBonus;
        addLog("Солнечный метеор поглощает горение цели.");
      }
    }
    if (spell.id === "shadowSpike" && target.hp < target.maxHp) {
      damage += 2 + state.player.shadowWoundBonus + spellUpgradeTotal(spell.id, "woundedBonus");
      if (evolution?.id === "twilightBlade") {
        damage += evolution.executeBonus;
      }
    }
    if (spell.id === "dawnRay" && target.tags.includes("undead")) {
      damage += spellUpgradeOverride(spell.id, "undeadBonus", 2);
    }

    const died = damageEnemy(target, damage, evolution?.id === "solarMeteor" ? evolution.name : spell.name, spell.element);
    addEffect(target.x, target.y, ELEMENT_COLORS[spell.element], 8, spell.name);

    if (spell.id === "fireball") {
      if (evolution?.id === "pyroclast") {
        state.hazards.push({
          id: nextId(),
          type: "fire",
          x: target.x,
          y: target.y,
          radius: 1,
          turns: evolution.hazardTurns,
          damage: evolution.hazardDamage,
          burnTurns: evolution.burnTurns,
        });
        if (!died && state.enemies.includes(target)) {
          target.burn = Math.max(target.burn, evolution.burnTurns);
        }
        addLog("Пирокласт оставляет горящую область.");
      } else if (evolution?.id !== "solarMeteor" && target.hp > 0 && Math.random() < 0.45) {
        target.burn = spellUpgradeOverride(spell.id, "burnTurns", 2);
        addLog(`${target.name} горит.`);
      }
    }

    if (spell.id === "iceShard") {
      if (evolution?.id === "icePrison" && !died && state.enemies.includes(target)) {
        target.slow = Math.max(target.slow, evolution.slowTurns);
        addLog(`${target.name} скован ледяной тюрьмой.`);
      } else if (evolution?.id === "shardStorm") {
        if (!died && state.enemies.includes(target)) {
          target.slow = Math.max(target.slow, evolution.slowTurns);
        }
        nearbyEnemies(target, evolution.sideRadius, new Set([target.id]))
          .slice(0, evolution.sideTargets)
          .forEach((enemy) => {
            const sideDamage = Math.max(1, spellDamage(spell, enemy) - evolution.sideDamagePenalty);
            damageEnemy(enemy, sideDamage, evolution.name, spell.element);
            if (state.enemies.includes(enemy)) {
              enemy.slow = Math.max(enemy.slow, evolution.slowTurns);
            }
            addEffect(enemy.x, enemy.y, ELEMENT_COLORS.ice, 8, "лед");
          });
        addLog("Осколочная буря разлетается по ближайшим целям.");
      } else if (target.hp > 0) {
        const slowMin = spellUpgradeOverride(spell.id, "slowMin", 2);
        const slowMax = spellUpgradeOverride(spell.id, "slowMax", 3);
        target.slow = Math.max(target.slow, randomInt(slowMin, slowMax));
        addLog(`${target.name} замедлен.`);
      }
    }

    if (spell.id === "dawnRay") {
      const heal = 1 + state.player.lightHealBonus + spellUpgradeTotal(spell.id, "healBonus") + (died ? 1 : 0);
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
      addLog(`Луч рассвета лечит ${heal} здоровья.`);
    }

    if (spell.id === "shadowSpike") {
      if (evolution?.id === "twilightBlade" && died) {
        state.pendingManaRefund += evolution.manaRefund;
      } else if (evolution?.id === "cursedMark" && !died && state.enemies.includes(target)) {
        target.curseMarkTurns = Math.max(target.curseMarkTurns, evolution.markTurns);
        target.curseMarkHits = Math.max(target.curseMarkHits, evolution.markHits);
        target.curseMarkBonus = Math.max(target.curseMarkBonus, evolution.markBonus);
        addLog(`${target.name} отмечен проклятой меткой.`);
      }
    }

    if (spell.id === "magicMissile") {
      if (evolution?.id === "echoMissile") {
        const echoTarget = nearbyEnemies(state.player, spell.range, new Set([target.id]))[0];
        if (echoTarget) {
          const echoDamage = Math.max(1, Math.round(spellDamage(spell, echoTarget) * evolution.echoMultiplier));
          damageEnemy(echoTarget, echoDamage, evolution.name, spell.element);
          addEffect(echoTarget.x, echoTarget.y, ELEMENT_COLORS.arcane, 8, "эхо");
        }
      } else if (evolution?.id === "manaNeedle" && died) {
        state.pendingManaRefund += evolution.manaRefund;
      }
    }

    return true;
  }

  function spellDamage(spell, enemy) {
    const elementBonus = state.player.elementBonus[spell.element] || 0;
    const weaknessBonus = enemy.weakTo.includes(spell.element) ? 1 : 0;
    const upgradeBonus = spellUpgradeTotal(spell.id, "damageBonus");
    const scaled = (spell.baseDamage + upgradeBonus + state.player.flatSpellBonus + weaknessBonus) *
      (state.player.spellDamageMultiplier + elementBonus);
    return Math.max(1, Math.round(scaled));
  }

  function firstEnemyOnLine(range) {
    const dir = state.lastMoveDir;
    if (!dir.x && !dir.y) {
      return null;
    }
    let x = state.player.x;
    let y = state.player.y;
    for (let step = 0; step < range; step += 1) {
      x += dir.x;
      y += dir.y;
      if (!isWalkable(x, y) || barrierAt(x, y)) {
        return null;
      }
      const enemy = enemyAt(x, y);
      if (enemy) {
        return isVisibleCell(enemy.x, enemy.y) ? enemy : null;
      }
    }
    return null;
  }

  function nearestEnemy(range) {
    return state.enemies
      .filter((enemy) =>
        enemy.hp > 0 &&
        isVisibleCell(enemy.x, enemy.y) &&
        distance(enemy, state.player) <= range
      )
      .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0] || null;
  }

  function enemiesOnLine(range) {
    const dir = state.lastMoveDir;
    if (!dir.x && !dir.y) {
      return [];
    }
    const targets = [];
    let x = state.player.x;
    let y = state.player.y;
    for (let step = 0; step < range; step += 1) {
      x += dir.x;
      y += dir.y;
      if (!isWalkable(x, y) || barrierAt(x, y)) {
        break;
      }
      const enemy = enemyAt(x, y);
      if (enemy && isVisibleCell(enemy.x, enemy.y)) {
        targets.push(enemy);
      }
    }
    return targets;
  }

  function nearestWoundedEnemy(range) {
    return state.enemies
      .filter((enemy) =>
        enemy.hp > 0 &&
        enemy.hp < enemy.maxHp &&
        isVisibleCell(enemy.x, enemy.y) &&
        distance(enemy, state.player) <= range
      )
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp) || distance(a, state.player) - distance(b, state.player))[0] || null;
  }

  function nearbyEnemies(center, range, excludeIds = new Set()) {
    return state.enemies
      .filter((enemy) =>
        enemy.hp > 0 &&
        !excludeIds.has(enemy.id) &&
        isVisibleCell(enemy.x, enemy.y) &&
        distance(enemy, center) <= range
      )
      .sort((a, b) => distance(a, center) - distance(b, center));
  }

  function adjustEnemyDamage(enemy, amount, element) {
    const rules = BOSS_RULES.mirrorArchmage;
    if (
      enemy.type === "mirrorArchmage" &&
      element &&
      enemy.resistElement === element &&
      enemy.resistTurns > 0
    ) {
      const reduced = Math.max(rules.minResistedDamage, Math.ceil(amount * (1 - rules.resistReduction)));
      if (reduced < amount) {
        addLog(`Зеркальный архимаг сопротивляется ${ELEMENT_NAMES[element] || "стихии"}.`);
      }
      return reduced;
    }
    return amount;
  }

  function refreshMirrorResistance(enemy, element) {
    if (enemy.type !== "mirrorArchmage" || !element || enemy.hp <= 0) {
      return;
    }
    const shouldLog = enemy.resistElement !== element || enemy.resistTurns <= 0;
    enemy.resistElement = element;
    enemy.resistTurns = BOSS_RULES.mirrorArchmage.resistTurns;
    if (shouldLog) {
      addLog(`Зеркальный архимаг подстроился к ${ELEMENT_NAMES[element] || "стихии"}.`);
    }
  }

  function applyDamageVulnerabilities(enemy, amount) {
    let finalAmount = amount;
    if (finalAmount > 0 && enemy.acidTurns > 0) {
      const bonus = enemy.acidBonus || 1;
      finalAmount += bonus;
      addLog(`${enemy.name}: кислота открывает слабое место (+${bonus}).`);
    }
    if (finalAmount > 0 && enemy.curseMarkTurns > 0 && enemy.curseMarkHits > 0) {
      const bonus = enemy.curseMarkBonus || 2;
      finalAmount += bonus;
      enemy.curseMarkHits -= 1;
      addLog(`${enemy.name}: проклятая метка усиливает удар (+${bonus}).`);
      if (enemy.curseMarkHits <= 0) {
        enemy.curseMarkTurns = 0;
      }
    }
    return finalAmount;
  }

  function removeEnemy(enemy) {
    state.enemies = state.enemies.filter((item) => item.id !== enemy.id);
  }

  function clearBossSummons(boss) {
    state.enemies = state.enemies.filter((enemy) => enemy.summonerId !== boss.id);
    state.hazards = state.hazards.filter((hazard) => hazard.summonerId !== boss.id);
  }

  function damageEnemy(enemy, amount, source, element = null) {
    const resistedAmount = adjustEnemyDamage(enemy, amount, element);
    const finalAmount = applyDamageVulnerabilities(enemy, resistedAmount);
    enemy.hp -= finalAmount;
    addLog(`${enemy.name} получает ${finalAmount} урона (${source}).`);
    addEffect(enemy.x, enemy.y, element ? ELEMENT_COLORS[element] : "#ffffff", 6, String(finalAmount));
    if (enemy.illusion && finalAmount > 0 && enemy.hp > 0) {
      enemy.hp = 0;
    }
    if (enemy.hp <= 0) {
      addLog(enemy.defeatText || `${enemy.name} побежден.`);
      removeEnemy(enemy);
      if (enemy.boss) {
        handleBossDefeat(enemy);
      }
      return true;
    }
    refreshMirrorResistance(enemy, element);
    return false;
  }

  function handleBossDefeat(enemy) {
    clearBossSummons(enemy);
    grantBossMagicShardReward(state.floor);
    if (state.floor >= CONFIG.maxFloors) {
      addLog("Сердце башни разбито. Башня спасена.");
      setMode(MODES.VICTORY);
      return;
    }

    state.objects.push({
      id: nextId(),
      type: EVENT_TYPES.STAIRS,
      x: enemy.x,
      y: enemy.y,
    });
    updateVision();
    addLog("После победы над стражем открывается переход выше.");
  }

  function damagePlayer(amount, message) {
    if (amount <= 0 || state.mode !== MODES.PLAYING) {
      return;
    }
    if (state.player.floorBlockAvailable) {
      state.player.floorBlockAvailable = false;
      addLog("Осторожный исследователь блокирует первый урон этажа.");
      return;
    }
    let remaining = amount;
    if (state.player.damageReductionTurns > 0 && state.player.damageReduction > 0) {
      const reduced = Math.min(remaining, state.player.damageReduction);
      remaining -= reduced;
      if (reduced > 0) {
        addLog(`Гранитный панцирь снижает урон на ${reduced}.`);
      }
    }
    if (state.player.shield > 0) {
      const blocked = Math.min(state.player.shield, remaining);
      state.player.shield -= blocked;
      remaining -= blocked;
      addLog(`Щит поглощает ${blocked} урона.`);
    }
    if (remaining > 0) {
      state.player.hp -= remaining;
      addLog(`${message} Вы теряете ${remaining} здоровья.`);
      addEffect(state.player.x, state.player.y, "#ff4d5a", 8, String(remaining));
    }
    if (state.player.hp <= 0) {
      state.player.hp = 0;
      addLog("Башня забирает последнюю искру мага.");
      setMode(MODES.GAME_OVER);
    }
  }

  function advanceTurn(enemyPhase = true) {
    if (state.mode !== MODES.PLAYING) {
      return;
    }
    state.turn += 1;
    updateVision();
    tickHazardsAndStatuses();
    if (enemyPhase && state.mode === MODES.PLAYING) {
      actEnemies();
    }
    tickBarriers();
    tickPlayerStatuses();
    const regenEvery = state.player.manaRegenEvery;
    if (state.turn % regenEvery === 0 && state.player.mana < state.player.maxMana) {
      state.player.mana += 1;
      addLog("Мана восстанавливается на 1.");
    }
    updateUI();
  }

  function applyAcid(enemy, hazard) {
    const turns = hazard.acidTurns || 0;
    if (turns <= 0 || !state.enemies.includes(enemy)) {
      return;
    }
    const wasAcidic = enemy.acidTurns > 0;
    enemy.acidTurns = Math.max(enemy.acidTurns, turns);
    enemy.acidBonus = Math.max(enemy.acidBonus || 0, hazard.acidBonus || 1);
    if (!wasAcidic) {
      addLog(`${enemy.name} покрыт кислотой.`);
    }
  }

  function spreadPlagueCloud(cell, sourceHazard) {
    state.hazards.push({
      id: nextId(),
      type: "poison",
      x: cell.x,
      y: cell.y,
      radius: 1,
      turns: sourceHazard.spreadTurns || 2,
      damage: Math.max(1, sourceHazard.damage || 1),
      spreadOnDeath: true,
      spreadTurns: sourceHazard.spreadTurns || 2,
    });
    addEffect(cell.x, cell.y, ELEMENT_COLORS.poison, 8, "чума");
    addLog("Чумное облако расползается от павшего врага.");
  }

  function tickBarriers() {
    state.barriers.forEach((barrier) => {
      barrier.turns -= 1;
    });
    state.barriers = state.barriers.filter((barrier) => barrier.turns > 0);
  }

  function tickPlayerStatuses() {
    if (state.player.damageReductionTurns > 0) {
      state.player.damageReductionTurns -= 1;
      if (state.player.damageReductionTurns <= 0) {
        state.player.damageReduction = 0;
      }
    }
  }

  function tickHazardsAndStatuses() {
    state.hazards.forEach((hazard) => {
      [...state.enemies].forEach((enemy) => {
        if (!state.enemies.includes(enemy)) {
          return;
        }
        if (distance(enemy, hazard) <= hazard.radius) {
          const deathCell = { x: enemy.x, y: enemy.y };
          if (hazard.type === "fire") {
            const died = damageEnemy(enemy, hazard.damage || 1, "пирокласт", "fire");
            if (!died && state.enemies.includes(enemy)) {
              enemy.burn = Math.max(enemy.burn, hazard.burnTurns || 2);
            }
          } else if (hazard.type === "poison" || hazard.type === "acid") {
            const died = damageEnemy(enemy, hazard.damage || 1, hazard.label || "ядовитое облако", "poison");
            if (died && hazard.spreadOnDeath) {
              spreadPlagueCloud(deathCell, hazard);
            } else if (!died && hazard.type === "acid") {
              applyAcid(enemy, hazard);
            }
          }
        }
      });
      if (distance(state.player, hazard) <= hazard.radius && hazard.type === "danger") {
        damagePlayer(1, "Опасная клетка вспыхивает.");
      }
      hazard.turns -= 1;
    });
    state.hazards = state.hazards.filter((hazard) => hazard.turns > 0);

    [...state.enemies].forEach((enemy) => {
      if (!state.enemies.includes(enemy)) {
        return;
      }
      if (enemy.lifetime > 0) {
        enemy.lifetime -= 1;
        if (enemy.lifetime <= 0) {
          addLog(enemy.defeatText || `${enemy.name} исчезает.`);
          removeEnemy(enemy);
          return;
        }
      }
      if (enemy.resistTurns > 0) {
        enemy.resistTurns -= 1;
      }
      if (enemy.acidTurns > 0) {
        enemy.acidTurns -= 1;
        if (enemy.acidTurns <= 0) {
          enemy.acidBonus = 0;
        }
      }
      if (enemy.curseMarkTurns > 0) {
        enemy.curseMarkTurns -= 1;
        if (enemy.curseMarkTurns <= 0) {
          enemy.curseMarkHits = 0;
          enemy.curseMarkBonus = 0;
        }
      }
      if (enemy.burn > 0) {
        enemy.burn -= 1;
        damageEnemy(enemy, 1, "горение", "fire");
      }
      if (!state.enemies.includes(enemy)) {
        return;
      }
      if (enemy.poison > 0) {
        enemy.poison -= 1;
        damageEnemy(enemy, 1, "яд", "poison");
      }
      if (!state.enemies.includes(enemy)) {
        return;
      }
      if (enemy.slow > 0) {
        enemy.slow -= 1;
      }
    });
  }

  function actEnemies() {
    const enemies = [...state.enemies];
    enemies.forEach(handleEnemyTurn);
  }

  function handleEnemyTurn(enemy) {
    if (!state.enemies.includes(enemy) || state.mode !== MODES.PLAYING) {
      return;
    }
    if (enemy.stun > 0) {
      enemy.stun -= 1;
      addEffect(enemy.x, enemy.y, ELEMENT_COLORS.lightning, 5, "!");
      return;
    }
    if (enemy.slow > 0) {
      return;
    }
    enemy.skipCounter = (enemy.skipCounter + 1) % enemy.speed;
    if (enemy.skipCounter !== 0) {
      return;
    }

    if (enemy.object) {
      actBossObject(enemy);
      return;
    }

    if (enemy.boss) {
      actBoss(enemy);
    }

    const dist = distance(enemy, state.player);
    if (dist <= enemy.range && hasLineOfSight(enemy, state.player, enemy.range)) {
      damagePlayer(enemyAttackDamage(enemy), enemyAttackText(enemy));
      return;
    }
    moveEnemyTowardPlayer(enemy);
  }

  function actBoss(enemy) {
    if (enemy.type === "boss") {
      actStoneArchgolem(enemy);
    } else if (enemy.type === "mirrorArchmage") {
      actMirrorArchmage(enemy);
    } else if (enemy.type === "towerAvatar") {
      actTowerAvatar(enemy);
    }
  }

  function actStoneArchgolem(boss) {
    const rules = BOSS_RULES.stoneArchgolem;
    boss.bossTimer += 1;
    if (boss.bossTimer % rules.specialEvery !== 0) {
      return;
    }

    const canSummon = canBossSummon(boss, (enemy) => enemy.type === "smallGolem", rules.maxSmallGolems);
    if (canSummon && Math.random() < rules.summonChance) {
      const spot = findSafeBossSpawnCell(boss, {
        maxDistance: 3,
        minPlayerDistance: rules.minSummonDistanceFromPlayer,
      });
      if (spot) {
        state.enemies.push(createEnemy("smallGolem", spot.x, spot.y, state.floor, {
          summonerId: boss.id,
          summoned: true,
          minion: true,
        }));
        addLog("Архиголем призывает малого голема.");
        return;
      }
    }

    if (Math.random() < 0.6) {
      placeBossDangerCell(boss, rules.runeTurns, "Архиголем выбивает в камне опасную руну.");
    } else {
      boss.nextAttackBonus = Math.max(boss.nextAttackBonus, rules.attackBoost);
      addLog("Архиголем собирает силу для следующего удара.");
    }
  }

  function actMirrorArchmage(boss) {
    const rules = BOSS_RULES.mirrorArchmage;
    boss.bossTimer += 1;
    if (boss.bossTimer % rules.specialEvery !== 0) {
      return;
    }

    if (canBossSummon(boss, (enemy) => enemy.illusion, rules.maxIllusions)) {
      const spot = findSafeBossSpawnCell(boss, {
        maxDistance: 3,
        minPlayerDistance: rules.minSummonDistanceFromPlayer,
      });
      if (spot) {
        state.enemies.push(createEnemy("mirrorIllusion", spot.x, spot.y, state.floor, {
          summonerId: boss.id,
          lifetime: rules.illusionTurns,
        }));
        addLog("Зеркальный архимаг создает хрупкую иллюзию.");
        return;
      }
    }

    boss.nextAttackBonus = Math.max(boss.nextAttackBonus, rules.attackBoost);
    addLog("Зеркальный архимаг складывает свет в усиленный луч.");
  }

  function actTowerAvatar(boss) {
    const rules = BOSS_RULES.towerAvatar;
    boss.bossTimer += 1;
    boss.shardCooldown = Math.max(0, boss.shardCooldown - 1);

    const phase = updateTowerAvatarPhase(boss);
    const actionEvery = phase === 3 ? rules.phase3Every : rules.specialEvery;
    if (phase === 1 || boss.bossTimer % actionEvery !== 0) {
      return;
    }

    if (phase === 2) {
      if (Math.random() < 0.35 && tryCreateTowerShard(boss)) {
        return;
      }
      placeBossDangerCell(boss, rules.hazardTurns, "Аватар башни зажигает опасные клетки.");
      return;
    }

    const roll = Math.random();
    if (roll < 0.4 && tryCreateTowerShard(boss)) {
      return;
    }
    if (roll < 0.75) {
      placeBossDangerCell(boss, rules.hazardTurns, "Сердце башни меняет узор пола опасными клетками.");
    } else {
      boss.nextAttackBonus = Math.max(boss.nextAttackBonus, rules.attackBoost);
      addLog("Аватар башни усиливает следующую атаку.");
    }
  }

  function actBossObject(enemy) {
    if (enemy.type !== "towerShard") {
      return;
    }
    enemy.bossTimer += 1;
    if (enemy.bossTimer % BOSS_RULES.towerAvatar.shardPulseEvery !== 0) {
      return;
    }
    placeBossDangerCell(enemy, BOSS_RULES.towerAvatar.hazardTurns, "Осколок башни искажает пол опасной клеткой.");
  }

  function updateTowerAvatarPhase(boss) {
    const rules = BOSS_RULES.towerAvatar;
    const hpRatio = boss.hp / boss.maxHp;
    const nextPhase = hpRatio <= rules.phase3Threshold ? 3 : hpRatio <= rules.phase2Threshold ? 2 : 1;
    if (boss.phase !== nextPhase) {
      boss.phase = nextPhase;
      if (nextPhase === 2) {
        addLog("Аватар башни переходит во вторую фазу: пол становится опасным.");
      } else if (nextPhase === 3) {
        addLog("Сердце башни раскрывается: финальная фаза ускоряет атаки.");
      }
    }
    return boss.phase;
  }

  function tryCreateTowerShard(boss) {
    const rules = BOSS_RULES.towerAvatar;
    const canCreate =
      boss.shardCooldown <= 0 &&
      canBossSummon(boss, (enemy) => enemy.type === "towerShard", rules.maxShards);
    if (!canCreate) {
      return false;
    }

    const spot = findSafeBossSpawnCell(boss, {
      maxDistance: 4,
      minPlayerDistance: rules.minShardDistanceFromPlayer,
    });
    if (!spot) {
      return false;
    }

    state.enemies.push(createEnemy("towerShard", spot.x, spot.y, state.floor, {
      hp: rules.shardHp,
      maxHp: rules.shardHp,
      summonerId: boss.id,
      summoned: true,
      object: true,
    }));
    boss.shardCooldown = rules.shardCooldown;
    addLog("Аватар башни создает Осколок башни: пока он цел, атаки сильнее.");
    return true;
  }

  function placeBossDangerCell(source, turns, message) {
    const candidates = getAdjacentCells(state.player.x, state.player.y)
      .filter((cell) => isWalkable(cell.x, cell.y) && !enemyAt(cell.x, cell.y));
    const spot = candidates.length ? sample(candidates) : { x: state.player.x, y: state.player.y };
    state.hazards.push({
      id: nextId(),
      type: "danger",
      x: spot.x,
      y: spot.y,
      radius: 0,
      turns,
      summonerId: source.summonerId || source.id,
    });
    addLog(message);
  }

  function enemyAttackText(enemy) {
    if (enemy.attackText) {
      return enemy.attackText;
    }
    return enemy.ranged ? `${enemy.name} швыряет проклятую страницу.` : `${enemy.name} атакует.`;
  }

  function enemyAttackDamage(enemy) {
    let amount = enemy.damage + (enemy.nextAttackBonus || 0);
    if (
      enemy.type === "towerAvatar" &&
      getActiveSummonsForBoss(enemy, (summon) => summon.type === "towerShard").length > 0
    ) {
      amount += BOSS_RULES.towerAvatar.shardDamageBonus;
    }
    enemy.nextAttackBonus = 0;
    return amount;
  }

  function moveEnemyTowardPlayer(enemy) {
    const options = [
      { x: enemy.x + Math.sign(state.player.x - enemy.x), y: enemy.y },
      { x: enemy.x, y: enemy.y + Math.sign(state.player.y - enemy.y) },
      { x: enemy.x - Math.sign(state.player.x - enemy.x), y: enemy.y },
      { x: enemy.x, y: enemy.y - Math.sign(state.player.y - enemy.y) },
    ];
    options.sort((a, b) => distance(a, state.player) - distance(b, state.player));
    const next = options.find((cell) =>
      isWalkable(cell.x, cell.y) &&
      !barrierAt(cell.x, cell.y) &&
      !enemyAt(cell.x, cell.y) &&
      !(state.player.x === cell.x && state.player.y === cell.y) &&
      (!(enemy.summoned || enemy.minion || enemy.illusion) || !wouldLeavePlayerEscape(cell, enemy))
    );
    if (next) {
      enemy.x = next.x;
      enemy.y = next.y;
    }
  }

  function hasLineOfSight(from, to, range) {
    if (distance(from, to) > range) {
      return false;
    }
    if (from.x !== to.x && from.y !== to.y) {
      return range === 1;
    }
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    let x = from.x;
    let y = from.y;
    while (x !== to.x || y !== to.y) {
      x += dx;
      y += dy;
      if (x === to.x && y === to.y) {
        return true;
      }
      if (!isWalkable(x, y) || barrierAt(x, y)) {
        return false;
      }
    }
    return true;
  }

  function getAdjacentCells(x, y) {
    return [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ].filter((cell) => isInside(cell.x, cell.y));
  }

  function randomAdjacentFreeCell(x, y) {
    const cells = getAdjacentCells(x, y).filter((cell) => isFreeCell(cell.x, cell.y));
    return cells.length ? sample(cells) : null;
  }

  function pushEnemy(enemy, steps) {
    const dx = Math.sign(enemy.x - state.player.x);
    const dy = Math.sign(enemy.y - state.player.y);
    let moved = false;
    for (let i = 0; i < steps; i += 1) {
      const next = { x: enemy.x + dx, y: enemy.y + dy };
      if (!isFreeCell(next.x, next.y)) {
        return { moved, blocked: true };
      }
      enemy.x = next.x;
      enemy.y = next.y;
      moved = true;
    }
    return { moved, blocked: false };
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
    state.effects.forEach((effect) => {
      effect.turns -= 1;
    });
    state.effects = state.effects.filter((effect) => effect.turns > 0);
    requestAnimationFrame(render);
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
        const color = artifact?.cursed ? CONFIG.colors.cursedArtifact : CONFIG.colors.artifact;
        drawGlyph(cx, cy, artifact?.cursed ? "✷" : "✧", color, 18);
      }
      ctx.globalAlpha = 1;

      if (
        visible &&
        state.player?.revealsSecrets &&
        [EVENT_TYPES.BOOK, EVENT_TYPES.CHEST, EVENT_TYPES.ARTIFACT].includes(object.type) &&
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
            ctx.fillStyle = "rgba(232, 78, 75, 0.42)";
          } else if (hazard.type === "fire") {
            ctx.fillStyle = "rgba(255, 112, 67, 0.38)";
          } else if (hazard.type === "acid") {
            ctx.fillStyle = "rgba(181, 231, 71, 0.36)";
          } else {
            ctx.fillStyle = CONFIG.colors.hazard;
          }
          ctx.fillRect(x * size + 3, y * size + 3, size - 6, size - 6);
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
    dom.floorLabel.textContent = `Этаж ${state.floor}`;
    dom.hpText.textContent = `${state.player.hp}/${state.player.maxHp}`;
    dom.hpFill.style.width = `${clamp((state.player.hp / state.player.maxHp) * 100, 0, 100)}%`;
    dom.manaText.textContent = `${state.player.mana}/${state.player.maxMana}`;
    dom.manaFill.style.width = `${clamp((state.player.mana / state.player.maxMana) * 100, 0, 100)}%`;
    dom.shieldText.textContent = `Щит: ${state.player.shield}`;
    if (dom.magicShardsText) {
      dom.magicShardsText.textContent = `Осколки: ${state.player.magicShards}`;
    }
    dom.turnText.textContent = `Ход ${state.turn}`;
    dom.traitName.textContent = state.player.trait ? state.player.trait.name : "—";
    dom.traitEffect.textContent = state.player.trait ? state.player.trait.description : "—";
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
      const canUpgrade = Boolean(upgrade && state.player.magicShards >= upgrade.cost);
      const canEvolve = canEvolveSpell(spellId);
      const upgradeInfo = upgrade
        ? `До ур. ${level + 1}: ${upgrade.cost} осколок - ${upgrade.text}`
        : evolution
          ? "Эволюция выбрана."
          : "Уровень 3 открыт для эволюции.";
      const evolutionInfo = evolution
        ? `<div class="spell-evolution is-chosen">Эволюция: <strong>${evolution.name}</strong> - ${evolution.description}</div>`
        : level >= MAX_SPELL_LEVEL && evolutions.length
          ? `<div class="spell-evolution">
              <div><strong>1. ${evolutions[0].name}</strong> - ${evolutions[0].description}</div>
              <div><strong>2. ${evolutions[1].name}</strong> - ${evolutions[1].description}</div>
              <span>Стоимость: ${EVOLUTION_COST} осколок</span>
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
              : `Нужен ${EVOLUTION_COST} осколок для эволюции`
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

    if (!state.player.artifacts.length) {
      const empty = document.createElement("div");
      empty.className = "artifact-empty";
      empty.textContent = "Артефактов пока нет.";
      dom.artifactList.appendChild(empty);
      return;
    }

    state.player.artifacts.forEach((artifact) => {
      const card = document.createElement("div");
      card.className = `artifact-card${artifact.cursed ? " is-cursed" : ""}`;
      card.innerHTML = `
        <div class="artifact-title">
          <span>${artifact.name}</span>
          <strong>${artifact.cursed ? "Проклят" : "Чистый"}</strong>
        </div>
        <div class="artifact-meta">${artifact.bonusText}</div>
        ${artifact.cursed ? `<div class="artifact-curse">${artifact.curseText}</div>` : ""}
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
        return "Неизвестный объект";
      });
    dom.nearbyText.textContent = nearbyObjects.length
      ? `${nearbyObjects.join(". ")}. Нажмите E.`
      : "Рядом пока ничего нет.";
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

  function updateOverlay() {
    dom.overlay.classList.toggle("is-visible", state.mode !== MODES.PLAYING);
    if (state.mode === MODES.MENU) {
      dom.overlayKicker.textContent = "Древняя башня ждет";
      dom.overlayTitle.textContent = "Башня последнего мага";
      dom.overlayText.textContent =
        "Пройдите 15 процедурных этажей, найдите книги заклинаний и победите Сердце башни. Каменный архиголем и Зеркальный архимаг ждут как испытания на 5 и 10 этажах.";
      dom.primaryAction.textContent = "Начать восхождение";
    } else if (state.mode === MODES.VICTORY) {
      dom.overlayKicker.textContent = "Победа";
      dom.overlayTitle.textContent = "Башня спасена";
      dom.overlayText.textContent =
        "Сердце башни пало, древняя магия стихла. Нажмите R или кнопку, чтобы начать новую партию.";
      dom.primaryAction.textContent = "Новая игра";
    } else if (state.mode === MODES.GAME_OVER) {
      dom.overlayKicker.textContent = "Поражение";
      dom.overlayTitle.textContent = "Маг пал в башне";
      dom.overlayText.textContent =
        "Башня оказалась сильнее на этот раз. Нажмите R или кнопку, чтобы попробовать другой билд.";
      dom.primaryAction.textContent = "Попробовать снова";
    }
  }

  dom.primaryAction.addEventListener("click", newGame);
  document.addEventListener("keydown", handleKeyDown);

  state.map = createEmptyMap();
  updateOverlay();
  render();
})();
