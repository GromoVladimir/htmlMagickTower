(() => {
  "use strict";

  const CONFIG = {
    mapWidth: 40,
    mapHeight: 25,
    tileSize: 22,
    maxFloors: 5,
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

  const SPELLS = {
    fireball: {
      id: "fireball",
      name: "Огненный шар",
      element: "fire",
      cost: 2,
      baseDamage: 3,
      range: 9,
      description: "Бьет первого врага на линии, может поджечь.",
    },
    iceShard: {
      id: "iceShard",
      name: "Ледяная стрела",
      element: "ice",
      cost: 2,
      baseDamage: 2,
      range: 8,
      description: "Урон и замедление на 1-2 хода.",
    },
    poisonCloud: {
      id: "poisonCloud",
      name: "Ядовитое облако",
      element: "poison",
      cost: 3,
      baseDamage: 1,
      range: 6,
      description: "Область яда на несколько ходов.",
    },
    chainLightning: {
      id: "chainLightning",
      name: "Цепная молния",
      element: "lightning",
      cost: 3,
      baseDamage: 3,
      range: 7,
      description: "Бьет ближайшего врага и перескакивает дальше.",
    },
    dawnRay: {
      id: "dawnRay",
      name: "Луч рассвета",
      element: "light",
      cost: 2,
      baseDamage: 2,
      range: 8,
      description: "Силен против нежити, лечит мага.",
    },
    shadowSpike: {
      id: "shadowSpike",
      name: "Теневой шип",
      element: "shadow",
      cost: 2,
      baseDamage: 2,
      range: 7,
      description: "Наносит больше урона раненым врагам.",
    },
    stoneArmor: {
      id: "stoneArmor",
      name: "Каменная броня",
      element: "earth",
      cost: 3,
      baseDamage: 0,
      range: 0,
      description: "Дает временный щит.",
    },
    windGust: {
      id: "windGust",
      name: "Порыв ветра",
      element: "wind",
      cost: 2,
      baseDamage: 1,
      range: 4,
      description: "Отталкивает ближайших врагов.",
    },
    magicMissile: {
      id: "magicMissile",
      name: "Магическая стрела",
      element: "arcane",
      cost: 1,
      baseDamage: 2,
      range: 8,
      description: "Дешевая стабильная атака.",
    },
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
      hp: 6,
      damage: 2,
      speed: 2,
      range: 1,
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
    },
  };

  const ACTS = [
    {
      id: "lastMageTower",
      name: "Last Mage Tower",
      floorRange: [1, 5],
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
      enemyCount: 7,
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
      enemyCount: 9,
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
      enemyCount: 11,
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
  };

  const BOSSES_BY_FLOOR = {
    5: "boss",
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
    effects: [],
    visible: [],
    explored: [],
    logs: [],
    turn: 0,
    selectedSpellIndex: 0,
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
    return Math.max(0, spell.cost + (state.player?.spellCostModifier || 0));
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
    state.effects = [];
    state.visible = [];
    state.explored = [];
    state.selectedSpellIndex = 0;
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
      addLog(BOSSES_BY_FLOOR[floor] ? "Каменный архиголем пробуждается." : `Вы поднимаетесь на этаж ${floor}.`);
    }
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

  function createEnemy(type, x, y, floor) {
    const template = ENEMY_TYPES[type];
    const scale = type === "boss" ? 0 : Math.max(0, floor - 1);
    return {
      id: nextId(),
      type,
      name: template.name,
      glyph: template.glyph,
      color: template.color,
      x,
      y,
      hp: template.hp + scale,
      maxHp: template.hp + scale,
      damage: template.damage + Math.floor(scale / 2),
      speed: template.speed,
      range: template.range,
      ranged: Boolean(template.ranged),
      boss: Boolean(template.boss),
      weakTo: template.weakTo || [],
      tags: template.tags || [],
      slow: 0,
      burn: 0,
      poison: 0,
      skipCounter: 0,
      bossTimer: 0,
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

  function isFreeCell(x, y) {
    return isWalkable(x, y) && !enemyAt(x, y) && !objectAt(x, y) && !(state.player && state.player.x === x && state.player.y === y);
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

    const dir = keyToDirection(key);
    if (dir) {
      tryMovePlayer(dir.x, dir.y);
      return;
    }

    if (["1", "2", "3"].includes(key)) {
      const index = Number(key) - 1;
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
    };
    const russianLayout = {
      ц: "w",
      ф: "a",
      ы: "s",
      в: "d",
      у: "e",
      к: "r",
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
    const acted = castSpell(spell);
    if (acted) {
      if (!isFree) {
        state.player.mana -= cost;
      } else {
        state.player.freeSpellAvailable = false;
        addLog("Экономный колдун сохраняет ману.");
      }
      addEffect(state.player.x, state.player.y, ELEMENT_COLORS[spell.element], 5, spell.name);
      advanceTurn();
    }
  }

  function castSpell(spell) {
    if (spell.id === "stoneArmor") {
      const amount = 3 + state.player.earthShieldBonus;
      state.player.shield += amount;
      addLog(`Каменная броня дает ${amount} щита.`);
      return true;
    }

    if (spell.id === "windGust") {
      const targets = state.enemies.filter((enemy) =>
        enemy.hp > 0 &&
        isVisibleCell(enemy.x, enemy.y) &&
        distance(enemy, state.player) <= spell.range
      );
      if (!targets.length) {
        addLog("Порыву ветра некого оттолкнуть.");
        return false;
      }
      targets.forEach((enemy) => {
        damageEnemy(enemy, spellDamage(spell, enemy), spell.name, spell.element);
        pushEnemy(enemy, 2 + state.player.windPushBonus);
      });
      return true;
    }

    if (spell.id === "poisonCloud") {
      const target = nearestEnemy(spell.range);
      const center = target || {
        x: state.player.x + state.lastMoveDir.x * Math.min(3, spell.range),
        y: state.player.y + state.lastMoveDir.y * Math.min(3, spell.range),
      };
      const safeCenter = isWalkable(center.x, center.y) ? center : { x: state.player.x, y: state.player.y };
      state.hazards.push({
        id: nextId(),
        type: "poison",
        x: safeCenter.x,
        y: safeCenter.y,
        radius: 1,
        turns: 3 + state.player.poisonBonusTurns,
      });
      addLog("Ядовитое облако расползается по плитам.");
      addEffect(safeCenter.x, safeCenter.y, ELEMENT_COLORS.poison, 8, "яд");
      return true;
    }

    if (spell.id === "chainLightning") {
      const first = nearestEnemy(spell.range);
      if (!first) {
        addLog("Молния не нашла цель.");
        return false;
      }
      damageEnemy(first, spellDamage(spell, first), spell.name, spell.element);
      addEffect(first.x, first.y, ELEMENT_COLORS.lightning, 8, "молния");
      const second = state.enemies
        .filter((enemy) =>
          enemy.hp > 0 &&
          enemy.id !== first.id &&
          isVisibleCell(enemy.x, enemy.y) &&
          distance(enemy, first) <= 4
        )
        .sort((a, b) => distance(a, first) - distance(b, first))[0];
      if (second) {
        damageEnemy(second, Math.max(1, spellDamage(spell, second) - 1), "скачок молнии", spell.element);
        addEffect(second.x, second.y, ELEMENT_COLORS.lightning, 8, "молния");
      }
      return true;
    }

    const target = firstEnemyOnLine(spell.range) || nearestEnemy(spell.range);
    if (!target) {
      addLog(`${spell.name}: нет цели в пределах действия.`);
      return false;
    }

    let damage = spellDamage(spell, target);
    if (spell.id === "shadowSpike" && target.hp < target.maxHp) {
      damage += 2 + state.player.shadowWoundBonus;
    }
    if (spell.id === "dawnRay" && target.tags.includes("undead")) {
      damage += 2;
    }

    const died = damageEnemy(target, damage, spell.name, spell.element);
    addEffect(target.x, target.y, ELEMENT_COLORS[spell.element], 8, spell.name);

    if (spell.id === "fireball" && target.hp > 0 && Math.random() < 0.45) {
      target.burn = 2;
      addLog(`${target.name} горит.`);
    }
    if (spell.id === "iceShard" && target.hp > 0) {
      target.slow = Math.max(target.slow, randomInt(2, 3));
      addLog(`${target.name} замедлен.`);
    }
    if (spell.id === "dawnRay") {
      const heal = 1 + state.player.lightHealBonus + (died ? 1 : 0);
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
      addLog(`Луч рассвета лечит ${heal} здоровья.`);
    }
    return true;
  }

  function spellDamage(spell, enemy) {
    const elementBonus = state.player.elementBonus[spell.element] || 0;
    const weaknessBonus = enemy.weakTo.includes(spell.element) ? 1 : 0;
    const scaled = (spell.baseDamage + state.player.flatSpellBonus + weaknessBonus) *
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
      if (!isWalkable(x, y)) {
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

  function damageEnemy(enemy, amount, source, element = null) {
    enemy.hp -= amount;
    addLog(`${enemy.name} получает ${amount} урона (${source}).`);
    addEffect(enemy.x, enemy.y, element ? ELEMENT_COLORS[element] : "#ffffff", 6, String(amount));
    if (enemy.hp <= 0) {
      addLog(`${enemy.name} побежден.`);
      if (enemy.boss) {
        addLog("Башня спасена.");
        setMode(MODES.VICTORY);
      }
      state.enemies = state.enemies.filter((item) => item.id !== enemy.id);
      return true;
    }
    return false;
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
    const regenEvery = state.player.manaRegenEvery;
    if (state.turn % regenEvery === 0 && state.player.mana < state.player.maxMana) {
      state.player.mana += 1;
      addLog("Мана восстанавливается на 1.");
    }
    updateUI();
  }

  function tickHazardsAndStatuses() {
    state.hazards.forEach((hazard) => {
      state.enemies.forEach((enemy) => {
        if (distance(enemy, hazard) <= hazard.radius) {
          damageEnemy(enemy, 1, "ядовитое облако", "poison");
        }
      });
      if (distance(state.player, hazard) <= hazard.radius && hazard.type === "danger") {
        damagePlayer(1, "Опасная клетка вспыхивает.");
      }
      hazard.turns -= 1;
    });
    state.hazards = state.hazards.filter((hazard) => hazard.turns > 0);

    [...state.enemies].forEach((enemy) => {
      if (enemy.burn > 0) {
        enemy.burn -= 1;
        damageEnemy(enemy, 1, "горение", "fire");
      }
      if (enemy.poison > 0) {
        enemy.poison -= 1;
        damageEnemy(enemy, 1, "яд", "poison");
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
    if (enemy.slow > 0) {
      return;
    }
    enemy.skipCounter = (enemy.skipCounter + 1) % enemy.speed;
    if (enemy.skipCounter !== 0) {
      return;
    }

    if (enemy.boss) {
      actBoss(enemy);
    }

    const dist = distance(enemy, state.player);
    if (dist <= enemy.range && hasLineOfSight(enemy, state.player, enemy.range)) {
      const attackText = enemy.ranged ? `${enemy.name} швыряет проклятую страницу.` : `${enemy.name} атакует.`;
      damagePlayer(enemy.damage, attackText);
      return;
    }
    moveEnemyTowardPlayer(enemy);
  }

  function actBoss(enemy) {
    enemy.bossTimer += 1;
    if (enemy.bossTimer % 4 !== 0) {
      return;
    }
    if (Math.random() < 0.55) {
      const spot = randomAdjacentFreeCell(enemy.x, enemy.y) || randomAdjacentFreeCell(state.player.x, state.player.y);
      if (spot) {
        state.enemies.push(createEnemy("smallGolem", spot.x, spot.y, state.floor));
        addLog("Архиголем призывает малого голема.");
      }
    } else {
      const spot = randomAdjacentFreeCell(state.player.x, state.player.y) || { x: state.player.x, y: state.player.y };
      state.hazards.push({
        id: nextId(),
        type: "danger",
        x: spot.x,
        y: spot.y,
        radius: 0,
        turns: 4,
      });
      addLog("Архиголем раскалывает камень опасной руной.");
    }
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
      !enemyAt(cell.x, cell.y) &&
      !(state.player.x === cell.x && state.player.y === cell.y)
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
      if (!isWalkable(x, y)) {
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
    for (let i = 0; i < steps; i += 1) {
      const next = { x: enemy.x + dx, y: enemy.y + dy };
      if (!isFreeCell(next.x, next.y)) {
        break;
      }
      enemy.x = next.x;
      enemy.y = next.y;
    }
  }

  function addEffect(x, y, color, turns, label = "") {
    state.effects.push({ x, y, color, turns, label });
  }

  function render() {
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
    drawMap();
    drawHazards();
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
          ctx.fillStyle = hazard.type === "danger" ? "rgba(232, 78, 75, 0.42)" : CONFIG.colors.hazard;
          ctx.fillRect(x * size + 3, y * size + 3, size - 6, size - 6);
        }
      }
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
      ctx.fillStyle = enemy.color;
      if (enemy.boss) {
        ctx.fillRect(enemy.x * size + 3, enemy.y * size + 3, size - 6, size - 6);
        drawGlyph(cx, cy + 1, enemy.glyph, "#1a1410", 16);
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
        ctx.fill();
        drawGlyph(cx, cy + 1, enemy.glyph, "#12151b", 13);
      }
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
      const card = document.createElement("div");
      card.className = `spell-card${index === state.selectedSpellIndex ? " is-active" : ""}`;
      card.innerHTML = `
        <div class="spell-title">
          <span>${index + 1}. ${spell.name}</span>
          <span style="color:${ELEMENT_COLORS[spell.element]}">${spellCost(spell)} м</span>
        </div>
        <div class="spell-meta">${spell.description}</div>
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
        "Пройдите 5 процедурных этажей, найдите книги заклинаний и победите Каменного архиголема.";
      dom.primaryAction.textContent = "Начать восхождение";
    } else if (state.mode === MODES.VICTORY) {
      dom.overlayKicker.textContent = "Победа";
      dom.overlayTitle.textContent = "Башня спасена";
      dom.overlayText.textContent =
        "Каменный архиголем пал, древняя магия стихла. Нажмите R или кнопку, чтобы начать новую партию.";
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
