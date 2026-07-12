(function registerArtifactHooks(global) {
  "use strict";

  const MT = global.MagicTower;
  if (!MT || typeof MT.registerBehavior !== "function") {
    throw new Error("MagicTower namespace must load before artifact hooks.");
  }
  if (!MT.data.artifacts) {
    throw new Error("Artifact definitions must load before artifact hooks.");
  }

  const phaseOrder = Object.freeze([
    "spellCost",
    "beforeSpellCast",
    "afterSpellCast",
    "afterSpellResolved",
    "enemyDefeated",
    "beforeDamageTaken",
    "afterDamageTaken",
    "beforePlayerDefeat",
  ]);

  function artifactFlags(context) {
    if (typeof context.api?.artifactFlags !== "function") {
      throw new Error("MagicTower API function artifactFlags is not installed.");
    }
    return context.api.artifactFlags();
  }

  /** @type {Record<string, (context: Object, entity: Object|null, params: Object) => *>} */
  const handlers = Object.freeze({
    firstSpellDiscount(context, _entity, params) {
      const flags = artifactFlags(context);
      if (flags.firstSpellDiscount > 0 && context.state.player?.spellsCastThisFloor === 0) {
        params.discount += flags.firstSpellDiscount;
      }
    },

    alternatingElementDiscount(context, _entity, params) {
      const flags = artifactFlags(context);
      if (
        flags.alternatingElementDiscount > 0 &&
        context.state.player?.lastSpellElement &&
        context.state.player.lastSpellElement !== params.spell.element
      ) {
        params.discount += flags.alternatingElementDiscount;
      }
    },

    glassMemoryDiscount(context, _entity, params) {
      const flags = artifactFlags(context);
      if (flags.glassMemoryDiscount > 0 && context.state.player?.glassMemoryDiscountAvailable) {
        params.discount += flags.glassMemoryDiscount;
      }
    },

    firstSpellEcho(context, _entity, params) {
      const flags = artifactFlags(context);
      if (flags.firstSpellEcho && context.state.player?.spellsCastThisFloor === 0) {
        params.shouldEcho = true;
        params.echoMessage = flags.firstSpellEchoMessage;
        params.echoManaRefund = flags.firstSpellEchoManaRefund;
      }
    },

    windSpellShield(context, _entity, params) {
      return context.api.applyArtifactAfterSpellCast(params.spell);
    },

    glassMemory(context, _entity, params) {
      return context.api.updateGlassMemoryAfterSpellCast(params.spell, params.discountWasUsed);
    },

    killMana(context, _entity, params) {
      return context.api.handleArtifactEnemyKill(params.enemy, params.element);
    },

    firstDamageReduction(context, _entity, params) {
      params.remaining = context.api.applyFirstDamageReduction(params.remaining);
    },

    damageShield(context) {
      return context.api.applyDamageShieldArtifact();
    },

    bastionShard(context) {
      return context.api.applyBastionShardRelic();
    },

    reflectionShard(context, _entity, params) {
      return context.api.applyReflectionShardRelic(params.sourceEnemy);
    },

    lastChance(context) {
      return context.api.triggerLastChanceArtifact();
    },
  });

  const definitions = MT.data.artifacts.ARTIFACTS.concat(
    MT.data.artifacts.SECRET_ARTIFACTS,
    MT.data.artifacts.BOSS_RELICS
  );
  const mutablePhases = Object.create(null);
  phaseOrder.forEach((phase) => {
    mutablePhases[phase] = [];
  });

  let declarationOrder = 0;
  definitions.forEach((definition) => {
    (definition.hooks || []).forEach((hook) => {
      if (!mutablePhases[hook.phase]) {
        throw new Error(`Unknown artifact hook phase ${hook.phase} on ${definition.id}.`);
      }
      const handler = handlers[hook.behaviorId];
      if (typeof handler !== "function") {
        throw new Error(`Missing artifact hook behavior ${hook.behaviorId} on ${definition.id}.`);
      }
      mutablePhases[hook.phase].push(Object.freeze({
        artifactId: definition.id,
        behaviorId: hook.behaviorId,
        priority: hook.priority,
        declarationOrder,
        handler,
      }));
      declarationOrder += 1;
    });
  });

  const phases = Object.freeze(Object.fromEntries(phaseOrder.map((phase) => [
    phase,
    Object.freeze(mutablePhases[phase].sort((left, right) =>
      left.priority - right.priority || left.declarationOrder - right.declarationOrder
    )),
  ])));

  function activeOwnedArtifacts(context) {
    return (context.state?.player?.artifacts || []).filter((artifact) =>
      artifact.active !== false && !artifact.spent
    );
  }

  /**
   * Runs hooks declared by the player's active artifact definitions. Entries are
   * ordered by numeric priority and then catalog declaration order. A behavior ID
   * runs once per phase because its handler consumes already-aggregated passives.
   * Handler contract: handler(context, entity, params).
   */
  function run(context, phase, params = {}, options = {}) {
    const entries = phases[phase];
    if (!entries) {
      throw new Error(`Unknown artifact hook phase: ${phase}.`);
    }

    const ownedByDefinition = new Map();
    activeOwnedArtifacts(context).forEach((artifact) => {
      const definitionId = artifact.definitionId || artifact.id;
      if (!ownedByDefinition.has(definitionId)) {
        ownedByDefinition.set(definitionId, artifact);
      }
    });

    const executedBehaviors = new Set();
    let handled = false;
    for (const entry of entries) {
      const entity = ownedByDefinition.get(entry.artifactId);
      if (!entity || executedBehaviors.has(entry.behaviorId)) {
        continue;
      }
      executedBehaviors.add(entry.behaviorId);
      const result = entry.handler(context, entity, params);
      handled = result === true || handled;
      if (handled && options.stopOnHandled) {
        break;
      }
    }
    return handled;
  }

  MT.registerBehavior("artifactHooks", Object.freeze({
    phaseOrder,
    phases,
    handlers,
    run,
  }));
})(globalThis);
