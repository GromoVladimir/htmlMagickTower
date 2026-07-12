(function registerEffectBehaviors(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerBehavior !== "function") {
    throw new Error("MagicTower.registerBehavior must be loaded before js/behaviors/effects.js");
  }

  /**
   * @typedef {Object} GameContext
   * @property {Object} [data]
   * @property {Object} [catalogs]
   * @property {Object} [behaviors]
   */

  /**
   * @typedef {Object} EffectDescriptor
   * @property {"property"|"changeMaxHp"|"changeMaxMana"|"capAt"} type
   * @property {string} [target]
   * @property {"add"|"max"|"set"} [operation]
   * @property {*} [value]
   * @property {string} [valueFrom]
   * @property {number} [amount]
   * @property {string} [maxTarget]
   * @property {string} [behaviorId]
   */

  /**
   * @typedef {Object} PassiveDescriptor
   * @property {string} target
   * @property {"add"|"max"|"set"} operation
   * @property {*} value
   * @property {Object} [condition]
   */

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function pathParts(path) {
    if (typeof path !== "string" || path.length === 0) {
      throw new TypeError("Effect target must be a non-empty string.");
    }
    return path.split(".");
  }

  function getPath(target, path) {
    return pathParts(path).reduce((value, key) => value == null ? undefined : value[key], target);
  }

  function setPath(target, path, value) {
    const parts = pathParts(path);
    const finalKey = parts.pop();
    let parent = target;

    parts.forEach((key) => {
      if (!parent[key] || typeof parent[key] !== "object") {
        parent[key] = {};
      }
      parent = parent[key];
    });

    parent[finalKey] = value;
    return value;
  }

  function descriptorValue(entity, descriptor) {
    if (descriptor.valueFrom) {
      return getPath(entity, descriptor.valueFrom);
    }
    return descriptor.value;
  }

  function applyOperation(target, path, operation, value) {
    const current = getPath(target, path);

    if (operation === "add") {
      return setPath(target, path, (current == null ? 0 : current) + value);
    }
    if (operation === "max") {
      return setPath(target, path, Math.max(current || 0, value));
    }
    if (operation === "set") {
      return setPath(target, path, value);
    }

    throw new Error(`Unknown effect operation: ${operation}`);
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

  function effectBehavior(context, behaviorId) {
    const contextEffects = context && context.behaviors && context.behaviors.effects;
    const registeredEffects = MT.behaviors && MT.behaviors.effects;
    const behavior = (contextEffects && contextEffects[behaviorId]) ||
      (registeredEffects && registeredEffects[behaviorId]);

    if (typeof behavior !== "function") {
      throw new Error(`Unknown effect behavior: ${behaviorId}`);
    }
    return behavior;
  }

  function applyEffect(context, entity, descriptor) {
    if (!descriptor || typeof descriptor !== "object") {
      throw new TypeError("Effect descriptor must be an object.");
    }

    if (descriptor.behaviorId) {
      return effectBehavior(context, descriptor.behaviorId)(context, entity, descriptor);
    }

    if (descriptor.type === "property") {
      return applyOperation(
        entity,
        descriptor.target,
        descriptor.operation,
        descriptorValue(entity, descriptor)
      );
    }
    if (descriptor.type === "changeMaxHp") {
      changeMaxHp(entity, descriptor.amount);
      return entity.maxHp;
    }
    if (descriptor.type === "changeMaxMana") {
      changeMaxMana(entity, descriptor.amount);
      return entity.maxMana;
    }
    if (descriptor.type === "capAt") {
      return setPath(
        entity,
        descriptor.target,
        Math.min(getPath(entity, descriptor.target), getPath(entity, descriptor.maxTarget))
      );
    }

    throw new Error(`Unknown effect type: ${descriptor.type}`);
  }

  /**
   * Applies one-time descriptors in their declared order.
   * Handler contract: handler(context, entity, { effects }).
   *
   * @param {GameContext} context
   * @param {Object} entity
   * @param {{effects: EffectDescriptor[]}|EffectDescriptor[]} params
   * @returns {Object}
   */
  function applyEffects(context, entity, params) {
    const effects = Array.isArray(params) ? params : (params && params.effects) || [];
    effects.forEach((descriptor) => applyEffect(context, entity, descriptor));
    return entity;
  }

  function createArtifactFlags() {
    return {
      earthShieldBonus: 0,
      windPushBonus: 0,
      floorStartShield: 0,
      floorKillMana: 0,
      fireBurnBonusTurns: 0,
      fireDamageToBurning: 0,
      lightningChainBonus: 0,
      lightningDamageBonus: 0,
      iceDamageToSlowed: 0,
      iceSlowBonusTurns: 0,
      shadowKillManaBonus: 0,
      shadowKillNextSpellDamage: 0,
      poisonHazardTurns: 0,
      poisonHazardDamage: 0,
      damageShield: 0,
      damageShieldCooldown: 0,
      windSpellShield: 0,
      alternatingElementDiscount: 0,
      lightDamageBonus: 0,
      shadowDamageBonus: 0,
      lightHealBonus: 0,
      shadowWoundBonus: 0,
      firstSpellDiscount: 0,
      statusDamageBonus: 0,
      burnTickBonus: 0,
      firstSpellEcho: false,
      firstSpellEchoManaRefund: 0,
      firstSpellEchoMessage: "Зеркало первого мага повторяет первое заклинание этажа.",
      firstDamageReduction: 0,
      contactSlowTurns: 0,
      bastionShield: 0,
      bastionShieldCooldown: 0,
      glassMemoryDiscount: 0,
      firstDamageReflect: 0,
      lastChance: false,
    };
  }

  function gameData(context) {
    return (context && (context.catalogs || context.data)) || MT.data || {};
  }

  function spellDefinitions(context) {
    const category = gameData(context).spells || {};
    return category.SPELLS || category.spells || category.definitions || category;
  }

  function spellEvolutions(context) {
    const data = gameData(context);
    const category = data.spells || {};
    return category.SPELL_EVOLUTIONS || category.spellEvolutions || data.SPELL_EVOLUTIONS || {};
  }

  function spellIdsForElement(context, player, element) {
    const definitions = spellDefinitions(context);
    return (player && Array.isArray(player.spells) ? player.spells : [])
      .filter((spellId) => definitions[spellId] && definitions[spellId].element === element);
  }

  function hasElementSpell(context, player, element) {
    return spellIdsForElement(context, player, element).length > 0;
  }

  function hasElementEvolution(context, player, element) {
    const evolutions = spellEvolutions(context);
    return spellIdsForElement(context, player, element).some((spellId) => {
      const selectedId = player.spellEvolutions && player.spellEvolutions[spellId];
      if (!selectedId) {
        return false;
      }

      const definitions = evolutions[spellId];
      return !Array.isArray(definitions) || definitions.some((definition) => definition.id === selectedId);
    });
  }

  function conditionMatches(context, entity, condition) {
    if (!condition) {
      return true;
    }
    if (Array.isArray(condition.all)) {
      return condition.all.every((item) => conditionMatches(context, entity, item));
    }
    if (Array.isArray(condition.any)) {
      return condition.any.some((item) => conditionMatches(context, entity, item));
    }
    if (condition.not) {
      return !conditionMatches(context, entity, condition.not);
    }
    if (condition.type === "hasElementSpell") {
      return hasElementSpell(context, entity, condition.element);
    }
    if (condition.type === "hasElementEvolution") {
      return hasElementEvolution(context, entity, condition.element);
    }

    throw new Error(`Unknown passive condition: ${condition.type}`);
  }

  function artifactDefinitionById(context, id) {
    const category = gameData(context).artifacts || {};
    if (category.byId && category.byId[id]) {
      return category.byId[id];
    }

    const definitions = []
      .concat(category.ARTIFACTS || [])
      .concat(category.SECRET_ARTIFACTS || [])
      .concat(category.BOSS_RELICS || []);
    return definitions.find((definition) => definition.id === id) || null;
  }

  function passiveSourceDefinition(context, source) {
    if (!source) {
      return null;
    }
    if (typeof source === "string") {
      return artifactDefinitionById(context, source);
    }
    if (source.definition) {
      return source.definition;
    }
    if (Array.isArray(source.passives)) {
      return source;
    }
    if (source.id) {
      return artifactDefinitionById(context, source.id);
    }
    if (source.definitionId) {
      return artifactDefinitionById(context, source.definitionId);
    }
    return null;
  }

  function applyPassive(context, entity, target, descriptor) {
    if (!conditionMatches(context, entity, descriptor.condition)) {
      return;
    }
    applyOperation(target, descriptor.target, descriptor.operation, descriptor.value);
  }

  /**
   * Rebuilds passive artifact flags from a fresh base object, preventing bonuses
   * from accumulating when spells or artifact activity change.
   * Handler contract: handler(context, player, { definitions?, sources?, base?, assignTo? }).
   *
   * @param {GameContext} context
   * @param {Object} entity
   * @param {Object[]|{definitions?: Object[], sources?: Object[], base?: Object, assignTo?: string|false}} [params]
   * @returns {Object}
   */
  function recomputePassives(context, entity, params) {
    const options = Array.isArray(params) ? { definitions: params } : (params || {});
    const sources = options.definitions || options.sources || (entity && entity.artifacts) || [];
    const target = Object.assign(createArtifactFlags(), options.base || {});

    sources.forEach((source) => {
      if (!source || source.active === false || source.spent) {
        return;
      }
      const definition = passiveSourceDefinition(context, source);
      if (!definition || !Array.isArray(definition.passives)) {
        return;
      }
      definition.passives.forEach((descriptor) => applyPassive(context, entity, target, descriptor));
    });

    const assignTo = options.assignTo === undefined ? "artifactFlags" : options.assignTo;
    if (entity && assignTo !== false) {
      setPath(entity, assignTo, target);
    }
    return target;
  }

  MT.registerBehavior("effects", {
    applyEffects,
    createArtifactFlags,
    recomputePassives,
    applyOperation,
    changeMaxHp,
    changeMaxMana,
    hasElementSpell,
    hasElementEvolution,
  });
})(window);
