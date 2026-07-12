// Procedural floor generation, placement, visibility, and spatial queries.
(function registerWorldsystem(global) {
  "use strict";

  const MagicTower = global.MagicTower;
  if (!MagicTower || typeof MagicTower.registerSystem !== "function") {
    throw new Error("MagicTower.registerSystem must load before js/systems/world.js");
  }

  /**
   * Installs the world API into a shared GameContext.
   * External calls are resolved lazily through context.api so installers may
   * be assembled before any gameplay entry point is invoked.
   * @param {GameContext} context
   * @returns {Record<string, Function>}
   */
  function installWorld(context) {
    if (!context || typeof context !== "object" || !context.api) {
      throw new TypeError("world requires a GameContext with an api object.");
    }
    const state = context.state;
    const dom = context.dom;
    const canvasContext = context.canvasContext;
    const data = context.data;
    const ctx = canvasContext;
    const effectBehaviors = context.behaviors && context.behaviors.effects;
    const effectContext = context.effectContext || context;
    const {
      CONFIG,
      TILES,
      ENEMY_SCALING,
      ENEMY_TYPES,
      BOSSES_BY_FLOOR,
      REWARD_RULES,
      EVENT_TYPES,
      EVENT_ROOM_DEFINITIONS,
      SECRET_HINT_MESSAGES,
    } = data;

    function randomInt(...args) {
      const implementation = context.api.randomInt;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function randomInt is not installed.");
      }
      return implementation(...args);
    }

    function sample(...args) {
      const implementation = context.api.sample;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function sample is not installed.");
      }
      return implementation(...args);
    }

    function clamp(...args) {
      const implementation = context.api.clamp;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function clamp is not installed.");
      }
      return implementation(...args);
    }

    function distance(...args) {
      const implementation = context.api.distance;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function distance is not installed.");
      }
      return implementation(...args);
    }

    function nextId(...args) {
      const implementation = context.api.nextId;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function nextId is not installed.");
      }
      return implementation(...args);
    }

    function createFlagMap(...args) {
      const implementation = context.api.createFlagMap;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function createFlagMap is not installed.");
      }
      return implementation(...args);
    }

    function getFloorRules(...args) {
      const implementation = context.api.getFloorRules;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function getFloorRules is not installed.");
      }
      return implementation(...args);
    }

    function getEnemyPoolForFloor(...args) {
      const implementation = context.api.getEnemyPoolForFloor;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function getEnemyPoolForFloor is not installed.");
      }
      return implementation(...args);
    }

    function chooseArtifact(...args) {
      const implementation = context.api.chooseArtifact;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function chooseArtifact is not installed.");
      }
      return implementation(...args);
    }

    function chooseChallengeReward(...args) {
      const implementation = context.api.chooseChallengeReward;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function chooseChallengeReward is not installed.");
      }
      return implementation(...args);
    }

    function addLog(...args) {
      const implementation = context.api.addLog;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function addLog is not installed.");
      }
      return implementation(...args);
    }

    function getAdjacentCells(...args) {
      const implementation = context.api.getAdjacentCells;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function getAdjacentCells is not installed.");
      }
      return implementation(...args);
    }

    function addEffect(...args) {
      const implementation = context.api.addEffect;
      if (typeof implementation !== "function") {
        throw new Error("MagicTower API function addEffect is not installed.");
      }
      return implementation(...args);
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
      if (context.rng.next() < 0.5) {
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
      placeFloorEvent(floorData);
      placeSecretRoom(floorData);
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
      const amount = rules.artifactCount + (context.rng.next() < rules.bonusArtifactChance ? 1 : 0);

      for (let i = 0; i < amount; i += 1) {
        const room = availableRooms.length
          ? availableRooms.splice(randomInt(0, availableRooms.length - 1), 1)[0]
          : sample(rooms.length ? rooms : floorData.rooms);
        const pos = randomFreeCellInRoom(room);
        if (!pos) {
          continue;
        }
        const artifact = chooseArtifact(context.rng.next() < rules.cursedArtifactChance);
        if (!artifact) {
          continue;
        }
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

    function placeFloorEvent(floorData) {
      if (
        BOSSES_BY_FLOOR[state.floor] ||
        state.objects.some((object) => object.type === EVENT_TYPES.EVENT_ROOM) ||
        context.rng.next() >= CONFIG.eventRoomChance
      ) {
        return;
      }

      const eventIds = Object.keys(EVENT_ROOM_DEFINITIONS);
      const eventId = sample(eventIds);
      const rooms = floorData.rooms.filter((room) => room !== floorData.startRoom && room !== floorData.exitRoom);
      const availableRooms = [...(rooms.length ? rooms : floorData.rooms.slice(1))];

      while (availableRooms.length) {
        const room = availableRooms.splice(randomInt(0, availableRooms.length - 1), 1)[0];
        const pos = randomFreeCellInRoom(room);
        if (!pos) {
          continue;
        }

        state.objects.push({
          id: nextId(),
          type: EVENT_TYPES.EVENT_ROOM,
          eventId,
          x: pos.x,
          y: pos.y,
          used: false,
          trialReward: eventId === "trialRoom" ? chooseChallengeReward() : null,
        });
        return;
      }
    }

    function secretPlacementCandidates(room) {
      const candidates = [];
      for (let x = room.x + 1; x < room.x + room.w - 1; x += 1) {
        candidates.push({
          entrance: { x, y: room.y - 1 },
          room: { x: x - 1, y: room.y - 4, w: 3, h: 3, secret: true },
          altar: { x, y: room.y - 3 },
          normalCell: { x, y: room.y },
        });
        candidates.push({
          entrance: { x, y: room.y + room.h },
          room: { x: x - 1, y: room.y + room.h + 1, w: 3, h: 3, secret: true },
          altar: { x, y: room.y + room.h + 2 },
          normalCell: { x, y: room.y + room.h - 1 },
        });
      }

      for (let y = room.y + 1; y < room.y + room.h - 1; y += 1) {
        candidates.push({
          entrance: { x: room.x - 1, y },
          room: { x: room.x - 4, y: y - 1, w: 3, h: 3, secret: true },
          altar: { x: room.x - 3, y },
          normalCell: { x: room.x, y },
        });
        candidates.push({
          entrance: { x: room.x + room.w, y },
          room: { x: room.x + room.w + 1, y: y - 1, w: 3, h: 3, secret: true },
          altar: { x: room.x + room.w + 2, y },
          normalCell: { x: room.x + room.w - 1, y },
        });
      }
      return candidates;
    }

    function cellInRoom(cell, room) {
      return cell.x >= room.x && cell.x < room.x + room.w &&
        cell.y >= room.y && cell.y < room.y + room.h;
    }

    function secretPlacementIsValid(placement) {
      const { entrance, room, altar, normalCell } = placement;
      if (
        room.x <= 1 ||
        room.y <= 1 ||
        room.x + room.w >= CONFIG.mapWidth - 1 ||
        room.y + room.h >= CONFIG.mapHeight - 1 ||
        !isInside(entrance.x, entrance.y) ||
        state.map[entrance.y][entrance.x] !== TILES.WALL ||
        !isWalkable(normalCell.x, normalCell.y) ||
        !cellInRoom(altar, room)
      ) {
        return false;
      }

      for (let y = room.y; y < room.y + room.h; y += 1) {
        for (let x = room.x; x < room.x + room.w; x += 1) {
          if (state.map[y][x] !== TILES.WALL || objectAt(x, y) || enemyAt(x, y)) {
            return false;
          }
        }
      }

      for (let y = room.y - 1; y <= room.y + room.h; y += 1) {
        for (let x = room.x - 1; x <= room.x + room.w; x += 1) {
          if (!isInside(x, y) || cellInRoom({ x, y }, room) || (x === entrance.x && y === entrance.y)) {
            continue;
          }
          if (state.map[y][x] !== TILES.WALL) {
            return false;
          }
        }
      }

      return true;
    }

    function findSecretRoomPlacement(floorData) {
      const sideRooms = floorData.rooms.filter((room) =>
        room !== floorData.startRoom &&
        room !== floorData.exitRoom
      );
      const rooms = [...(sideRooms.length ? sideRooms : floorData.rooms.slice(1))];
      while (rooms.length) {
        const room = rooms.splice(randomInt(0, rooms.length - 1), 1)[0];
        const candidates = secretPlacementCandidates(room);
        while (candidates.length) {
          const placement = candidates.splice(randomInt(0, candidates.length - 1), 1)[0];
          if (secretPlacementIsValid(placement)) {
            return placement;
          }
        }
      }
      return null;
    }

    function placeSecretRoom(floorData) {
      const settings = CONFIG.secretRoom;
      if (
        state.secretEntranceId ||
        state.secretRewardClaimed ||
        BOSSES_BY_FLOOR[state.floor] ||
        state.floor < settings.floorRange[0] ||
        state.floor > settings.floorRange[1] ||
        settings.excludedFloors.includes(state.floor) ||
        context.rng.next() >= settings.floorChance
      ) {
        return;
      }

      const placement = findSecretRoomPlacement(floorData);
      if (!placement) {
        return;
      }

      carveRoom(state.map, placement.room);
      state.rooms.push(placement.room);

      const entranceId = nextId();
      state.secretEntranceId = entranceId;
      state.objects.push({
        id: entranceId,
        type: EVENT_TYPES.SECRET_ENTRANCE,
        x: placement.entrance.x,
        y: placement.entrance.y,
        opened: false,
        discovered: false,
        hintShown: false,
      });
      state.objects.push({
        id: nextId(),
        type: EVENT_TYPES.SECRET_ALTAR,
        x: placement.altar.x,
        y: placement.altar.y,
        used: false,
      });
    }

    function chooseFirstFloorBooks() {
      const trait = data.getTrait(state.player.traitId);
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
      const definitionId = data.resolveBossId(type);
      const template = ENEMY_TYPES[definitionId] || ENEMY_TYPES[type];
      if (!template) {
        throw new Error(`Unknown enemy definition: ${type}.`);
      }
      const fixedPower = Boolean(
        template.boss ||
        template.illusion ||
        template.object ||
        overrides.summoned ||
        overrides.illusion ||
        overrides.object
      );
      const scale = fixedPower ? 0 : Math.max(0, floor - 1);
      const damageScaleEvery = Math.max(1, template.damageScaleEvery || ENEMY_SCALING.defaultDamageScaleEvery);
      const hp = overrides.hp ?? template.hp + Math.floor(scale * ENEMY_SCALING.hpPerFloor);
      const damage = overrides.damage ?? template.damage + Math.floor((scale * ENEMY_SCALING.damagePerFloor) / damageScaleEvery);
      return {
        id: nextId(),
        definitionId,
        type: definitionId,
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
        summoned: Boolean(overrides.summoned ?? (template.summoned && fixedPower)),
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
        weakTo: [...(template.weakTo || [])],
        tags: [...(template.tags || [])],
        knockbackResistance: template.knockbackResistance || 0,
        manaBurn: template.manaBurn || 0,
        markCooldown: template.markCooldown || 0,
        markCooldownLeft: template.markCooldown ? randomInt(1, template.markCooldown) : 0,
        markChance: template.markChance || 0,
        dashCooldown: template.dashCooldown || 0,
        dashCooldownLeft: template.dashCooldown ? randomInt(1, template.dashCooldown) : 0,
        dashChance: template.dashChance || 0,
        dashRange: template.dashRange || 0,
        postDashDelay: template.postDashDelay || 0,
        postDashDelayLeft: 0,
        crystalShieldActive: Boolean(template.crystalShield),
        hazardCooldown: template.hazardCooldown || 0,
        hazardCooldownLeft: template.hazardCooldown ? randomInt(1, template.hazardCooldown) : 0,
        hazardTurns: template.hazardTurns || 0,
        maxSourceHazards: template.maxSourceHazards || 0,
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

    function currentSecretEntrance() {
      return state.objects.find((object) => object.type === EVENT_TYPES.SECRET_ENTRANCE) || null;
    }

    function revealSecretEntrance(entrance) {
      if (!entrance || entrance.discovered) {
        return;
      }
      entrance.discovered = true;
      state.secretRoomDiscovered = true;
    }

    function openSecretEntrance(entrance, message) {
      if (!entrance) {
        return false;
      }
      revealSecretEntrance(entrance);
      if (entrance.opened) {
        addLog("Тайный проход уже открыт.");
        return false;
      }

      entrance.opened = true;
      state.secretRoomOpened = true;
      state.map[entrance.y][entrance.x] = TILES.FLOOR;
      addEffect(entrance.x, entrance.y, CONFIG.colors.secretRoom, 10, "руна");
      updateVision();
      addLog(message || "Скрытая стена отъезжает в сторону, открывая тайную комнату.");
      return true;
    }

    function nearbySecretEntrance(maxDistance = CONFIG.secretRoom.hintRadius) {
      const entrance = currentSecretEntrance();
      if (!entrance || entrance.opened || !state.player) {
        return null;
      }
      return distance(entrance, state.player) <= maxDistance ? entrance : null;
    }

    function checkSecretEntranceProximity() {
      const entrance = nearbySecretEntrance();
      if (!entrance) {
        return;
      }

      revealSecretEntrance(entrance);
      if (!entrance.hintShown) {
        entrance.hintShown = true;
        addLog(sample(SECRET_HINT_MESSAGES));
      }
    }

    function tryOpenSecretEntranceWithSpell(spell) {
      const entrance = nearbySecretEntrance(1);
      if (!entrance) {
        return false;
      }
      return openSecretEntrance(
        entrance,
        `${spell.name} отзывается на пустоту в камне. Тайный проход открывается.`
      );
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

    const localApi = {
      createEmptyMap,
      carveRoom,
      carveCorridor,
      roomsOverlap,
      roomCenter,
      generateFloor,
      placeFloorContent,
      placeBoss,
      placeEnemies,
      placeResources,
      placeArtifacts,
      placeTraps,
      placeFloorEvent,
      secretPlacementCandidates,
      cellInRoom,
      secretPlacementIsValid,
      findSecretRoomPlacement,
      placeSecretRoom,
      chooseFirstFloorBooks,
      placeFirstFloorBooks,
      randomFreeCellInRoom,
      createEnemy,
      isInside,
      isWalkable,
      isVisibleCell,
      isExploredCell,
      roomAt,
      markVisible,
      revealRoom,
      revealReachableRadius,
      updateVision,
      objectAt,
      currentSecretEntrance,
      revealSecretEntrance,
      openSecretEntrance,
      nearbySecretEntrance,
      checkSecretEntranceProximity,
      tryOpenSecretEntranceWithSpell,
      enemyAt,
      barrierAt,
      isFreeCell,
      getActiveSummonsForBoss,
      canBossSummon,
      sameCell,
      wouldLeavePlayerEscape,
      cellsWithinDistance,
      findSafeBossSpawnCell,
    };
    Object.assign(context.api, localApi);
    return localApi;
  }

  MagicTower.registerSystem("world", installWorld);
})(globalThis);
