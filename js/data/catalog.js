(function registerContentCatalog(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerData !== "function" || typeof MT.registerRuntime !== "function") {
    throw new Error("MagicTower namespace must load before js/data/catalog.js.");
  }

  const requiredCategories = [
    "config",
    "spells",
    "traits",
    "artifacts",
    "enemies",
    "bosses",
    "world",
    "events",
  ];
  requiredCategories.forEach((category) => {
    if (!MT.data[category]) {
      throw new Error(`Missing MagicTower data category: ${category}.`);
    }
  });
  if (!MT.behaviors.effects || !MT.behaviors.artifactHooks) {
    throw new Error("Effect and artifact-hook behaviors must load before the content catalog.");
  }

  const { config, spells, traits, artifacts, enemies, bosses, world, events } = MT.data;

  function createIndex(definitions, label) {
    const index = Object.create(null);
    definitions.forEach((definition) => {
      if (!definition || typeof definition.id !== "string" || !definition.id) {
        throw new Error(`${label} contains a definition without a valid id.`);
      }
      if (index[definition.id]) {
        throw new Error(`Duplicate ${label} id: ${definition.id}.`);
      }
      index[definition.id] = definition;
    });
    return Object.freeze(index);
  }

  const ENEMY_TYPES = Object.assign(
    Object.create(null),
    enemies.ENEMY_TYPES,
    bosses.BOSS_TYPES
  );
  Object.defineProperty(ENEMY_TYPES, "boss", {
    configurable: false,
    enumerable: false,
    value: bosses.BOSS_TYPES.stoneArchgolem,
    writable: false,
  });
  Object.freeze(ENEMY_TYPES);

  const traitsById = createIndex(traits.TRAITS, "trait");
  const artifactsById = createIndex(
    artifacts.ARTIFACTS.concat(artifacts.SECRET_ARTIFACTS, artifacts.BOSS_RELICS),
    "artifact"
  );
  const bossesById = Object.freeze(Object.assign(Object.create(null), bosses.BOSS_TYPES));
  const enemiesById = ENEMY_TYPES;
  const eventsById = Object.freeze(Object.assign(Object.create(null), events.EVENT_ROOM_DEFINITIONS));
  const spellsById = spells.SPELLS;
  const secretRewardsById = createIndex(events.SECRET_REWARD_DEFINITIONS, "secret reward");

  const flat = Object.freeze(Object.assign(
    Object.create(null),
    config,
    spells,
    traits,
    artifacts,
    enemies,
    bosses,
    world,
    events,
    { ENEMY_TYPES }
  ));

  function assertReference(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function validateBehavior(category, behaviorId, owner) {
    assertReference(
      typeof MT.behaviors[category]?.[behaviorId] === "function",
      `${owner} references missing ${category} behavior ${behaviorId}.`
    );
  }

  function validateEffectDescriptor(descriptor, owner) {
    assertReference(descriptor && typeof descriptor === "object", `${owner} has an invalid effect.`);
    if (descriptor.behaviorId) {
      assertReference(
        typeof MT.behaviors.effects[descriptor.behaviorId] === "function",
        `${owner} references missing effect behavior ${descriptor.behaviorId}.`
      );
      return;
    }
    assertReference(
      ["property", "changeMaxHp", "changeMaxMana", "capAt"].includes(descriptor.type),
      `${owner} has unknown effect type ${descriptor.type}.`
    );
    if (descriptor.type === "property") {
      assertReference(
        ["add", "max", "set"].includes(descriptor.operation),
        `${owner} has unknown effect operation ${descriptor.operation}.`
      );
    }
  }

  function validatePassive(descriptor, owner) {
    assertReference(descriptor && typeof descriptor.target === "string", `${owner} has an invalid passive.`);
    assertReference(
      ["add", "max", "set"].includes(descriptor.operation),
      `${owner} has unknown passive operation ${descriptor.operation}.`
    );
    const conditions = descriptor.condition
      ? descriptor.condition.all || descriptor.condition.any || [descriptor.condition]
      : [];
    conditions.forEach((condition) => {
      const value = condition.not || condition;
      assertReference(
        ["hasElementSpell", "hasElementEvolution"].includes(value.type),
        `${owner} has unknown passive condition ${value.type}.`
      );
      assertReference(Boolean(config.ELEMENT_COLORS[value.element]), `${owner} uses unknown element ${value.element}.`);
    });
  }

  function validate() {
    const expectedFloors = Array.from({ length: config.CONFIG.maxFloors }, (_, index) => index + 1);
    const actualFloors = Object.keys(world.FLOOR_RULES).map(Number).sort((left, right) => left - right);
    assertReference(
      actualFloors.join(",") === expectedFloors.join(","),
      `Floor rules must use exact keys 1..${config.CONFIG.maxFloors}.`
    );

    Object.entries(spells.SPELLS).forEach(([id, definition]) => {
      assertReference(definition.id === id, `Spell key/id mismatch for ${id}.`);
    });
    Object.entries(enemies.ENEMY_TYPES).forEach(([id, definition]) => {
      assertReference(definition.id === id, `Enemy key/id mismatch for ${id}.`);
      assertReference(!bosses.BOSS_TYPES[id], `Enemy/boss id collision: ${id}.`);
    });
    Object.entries(bosses.BOSS_TYPES).forEach(([id, definition]) => {
      assertReference(definition.id === id, `Boss key/id mismatch for ${id}.`);
      assertReference(Boolean(bosses.BOSS_RULES[id]), `Boss ${id} has no rules.`);
    });
    Object.entries(bosses.BOSS_ALIASES).forEach(([alias, id]) => {
      assertReference(!enemies.ENEMY_TYPES[alias], `Boss alias collides with enemy id: ${alias}.`);
      assertReference(Boolean(bosses.BOSS_TYPES[id]), `Boss alias ${alias} targets missing boss ${id}.`);
    });

    spells.BOOK_SPELLS.forEach((spellId) => {
      assertReference(Boolean(spellsById[spellId]), `Book pool references missing spell ${spellId}.`);
    });
    Object.values(spells.ELEMENT_TRAIT_BOOK).forEach((spellId) => {
      assertReference(Boolean(spellsById[spellId]), `Element book map references missing spell ${spellId}.`);
    });
    Object.keys(spells.SPELL_UPGRADES).forEach((spellId) => {
      assertReference(Boolean(spellsById[spellId]), `Upgrades reference missing spell ${spellId}.`);
    });
    Object.keys(spells.SPELL_EVOLUTIONS).forEach((spellId) => {
      assertReference(Boolean(spellsById[spellId]), `Evolutions reference missing spell ${spellId}.`);
      const evolutionIds = new Set(spells.SPELL_EVOLUTIONS[spellId].map((entry) => entry.id));
      assertReference(evolutionIds.size === spells.SPELL_EVOLUTIONS[spellId].length, `Duplicate evolution for ${spellId}.`);
    });
    Object.values(spellsById).forEach((spell) => {
      validateBehavior("spells", spell.behaviorId, `Spell ${spell.id}`);
    });

    world.ACTS.forEach((act) => {
      assertReference(Boolean(world.ENEMY_POOLS_BY_ACT[act.enemyPool]), `Act ${act.id} has no enemy pool.`);
      assertReference(Boolean(world.ARTIFACT_POOLS_BY_ACT[act.artifactPool]), `Act ${act.id} has no artifact pool.`);
    });
    Object.entries(world.ARTIFACT_POOLS_BY_ACT).forEach(([poolId, pool]) => {
      assertReference(Array.isArray(pool.tierWeights) && pool.tierWeights.length > 0, `Artifact pool ${poolId} is empty.`);
      pool.tierWeights.forEach(({ tier, weight }) => {
        assertReference(Number.isInteger(tier) && tier >= 1 && tier <= 3, `Artifact pool ${poolId} has invalid tier ${tier}.`);
        assertReference(typeof weight === "number" && weight > 0, `Artifact pool ${poolId} has invalid weight.`);
        assertReference(
          artifacts.ARTIFACTS.some((artifact) => !artifact.cursed && artifact.tier === tier),
          `Artifact pool ${poolId} references empty tier ${tier}.`
        );
      });
    });
    Object.values(world.ENEMY_POOLS_BY_ACT).forEach((pool) => {
      const ids = (pool.default || []).concat(...Object.values(pool.byFloor || {}));
      ids.forEach((enemyId) => {
        assertReference(Boolean(enemiesById[enemyId]), `Enemy pool references missing enemy ${enemyId}.`);
      });
    });
    Object.entries(enemies.ENEMY_TYPES).forEach(([enemyId, enemy]) => {
      if (enemy.behaviorId) {
        validateBehavior("enemies", enemy.behaviorId, `Enemy ${enemyId}`);
      }
    });

    Object.entries(bosses.BOSSES_BY_FLOOR).forEach(([floor, bossId]) => {
      assertReference(Boolean(world.FLOOR_RULES[floor]), `Boss ${bossId} uses missing floor ${floor}.`);
      assertReference(Boolean(bossesById[bossId]), `Floor ${floor} references missing boss ${bossId}.`);
      assertReference(Boolean(bosses.BOSS_RULES[bossId]), `Boss ${bossId} has no rules.`);
      validateBehavior("bosses", bossesById[bossId].behaviorId, `Boss ${bossId}`);
    });
    artifacts.BOSS_RELICS.forEach((relic) => {
      assertReference(Boolean(bosses.BOSSES_BY_FLOOR[relic.bossFloor]), `Relic ${relic.id} uses non-boss floor.`);
    });

    traits.TRAITS.forEach((trait) => {
      (trait.onAcquire || []).forEach((descriptor) => validateEffectDescriptor(descriptor, `Trait ${trait.id}`));
    });
    Object.values(artifactsById).forEach((artifact) => {
      (artifact.onAcquire || []).forEach((descriptor) => validateEffectDescriptor(descriptor, `Artifact ${artifact.id}`));
      (artifact.passives || []).forEach((descriptor) => validatePassive(descriptor, `Artifact ${artifact.id}`));
      (artifact.hooks || []).forEach((hook) => {
        assertReference(
          MT.behaviors.artifactHooks.phaseOrder.includes(hook.phase),
          `Artifact ${artifact.id} references missing hook phase ${hook.phase}.`
        );
        assertReference(
          Number.isFinite(hook.priority),
          `Artifact ${artifact.id} hook ${hook.behaviorId} has an invalid priority.`
        );
        assertReference(
          typeof MT.behaviors.artifactHooks.handlers[hook.behaviorId] === "function",
          `Artifact ${artifact.id} references missing hook ${hook.behaviorId}.`
        );
      });
    });

    Object.entries(events.EVENT_ROOM_DEFINITIONS).forEach(([id, definition]) => {
      assertReference(definition.id === id, `Event key/id mismatch for ${id}.`);
      validateBehavior("events", definition.behaviorId, `Event ${id}`);
    });
    events.SECRET_REWARD_DEFINITIONS.forEach((definition) => {
      validateBehavior("secretRewards", definition.behaviorId, `Secret reward ${definition.id}`);
    });
    Object.entries(events.WORLD_OBJECT_TYPES).forEach(([id, definition]) => {
      assertReference(Object.values(events.EVENT_TYPES).includes(id), `World object ${id} has no EVENT_TYPES value.`);
      assertReference(typeof definition.rendererId === "string", `World object ${id} has no rendererId.`);
      assertReference(typeof definition.interactionId === "string", `World object ${id} has no interactionId.`);
    });
    Object.values(events.EVENT_TYPES).forEach((id) => {
      assertReference(Boolean(events.WORLD_OBJECT_TYPES[id]), `EVENT_TYPES ${id} has no world-object definition.`);
    });
    const artifactHookPhases = MT.behaviors.artifactHooks.phases;
    const declaredHookCount = Object.values(artifactsById)
      .reduce((count, artifact) => count + (artifact.hooks || []).length, 0);
    const indexedHookCount = Object.values(artifactHookPhases)
      .reduce((count, entries) => count + entries.length, 0);
    assertReference(declaredHookCount === indexedHookCount, "Artifact hook index is incomplete.");
    assertReference(
      new Set(MT.behaviors.artifactHooks.phaseOrder).size === MT.behaviors.artifactHooks.phaseOrder.length,
      "Artifact hook phase order contains duplicates."
    );
    MT.behaviors.artifactHooks.phaseOrder.forEach((phase) => {
      assertReference(Boolean(artifactHookPhases[phase]), `Artifact hook phase ${phase} has no index.`);
    });
    Object.entries(artifactHookPhases).forEach(([phase, entries]) => {
      let previousPriority = -Infinity;
      const keys = new Set();
      entries.forEach((entry) => {
        assertReference(typeof entry.handler === "function", `Artifact hook ${phase}/${entry.id} has no handler.`);
        assertReference(entry.priority >= previousPriority, `Artifact hook phase ${phase} is not priority-sorted.`);
        const key = `${entry.artifactId}/${entry.behaviorId}`;
        assertReference(!keys.has(key), `Duplicate artifact hook ${phase}/${key}.`);
        assertReference(Boolean(artifactsById[entry.artifactId]), `Artifact hook ${phase}/${key} has no artifact.`);
        assertReference(
          entry.handler === MT.behaviors.artifactHooks.handlers[entry.behaviorId],
          `Artifact hook ${phase}/${key} has the wrong handler.`
        );
        previousPriority = entry.priority;
        keys.add(key);
      });
    });
    assertReference(Boolean(artifactsById.forgottenArchmageKey), "Secret key reward has no artifact definition.");
    assertReference(Boolean(secretRewardsById.forgottenArchmageKey), "Secret key reward definition is missing.");
    return true;
  }

  const catalog = Object.freeze(Object.assign(Object.create(null), flat, {
    legacy: flat,
    traitsById,
    artifactsById,
    enemiesById,
    bossesById,
    eventsById,
    spellsById,
    secretRewardsById,
    resolveBossId: bosses.resolveBossId,
    getSpell: (id) => spellsById[id] || null,
    getTrait: (id) => traitsById[id] || null,
    getArtifact: (id) => artifactsById[id] || null,
    getEnemy: (id) => enemiesById[bosses.resolveBossId(id)] || enemiesById[id] || null,
    getBoss: (id) => bossesById[bosses.resolveBossId(id)] || null,
    getEvent: (id) => eventsById[id] || null,
    getSecretReward: (id) => secretRewardsById[id] || null,
    validate,
  }));

  validate();
  const immutableCatalog = MT.registerData("catalog", catalog);
  MT.registerRuntime("catalog", immutableCatalog);
})(globalThis);
