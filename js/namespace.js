(function initializeMagicTower(root) {
  'use strict';

  if (!root || (typeof root !== 'object' && typeof root !== 'function')) {
    throw new TypeError('MagicTower requires a global object.');
  }

  if (Object.prototype.hasOwnProperty.call(root, 'MagicTower')) {
    throw new Error('MagicTower namespace is already initialized.');
  }

  var hasOwn = Object.prototype.hasOwnProperty;

  /**
   * Recursively freezes an object graph and returns the original value.
   * Cycles and shared references are supported.
   *
   * @template T
   * @param {T} value
   * @param {WeakSet<object>=} seen
   * @returns {T}
   */
  function deepFreeze(value, seen) {
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function')
    ) {
      return value;
    }

    var visited = seen || new WeakSet();
    if (visited.has(value)) {
      return value;
    }
    visited.add(value);

    Reflect.ownKeys(value).forEach(function freezeChild(key) {
      deepFreeze(value[key], visited);
    });

    if (!Object.isFrozen(value)) {
      Object.freeze(value);
    }
    return value;
  }

  function createSection() {
    return Object.create(null);
  }

  function validateRegistration(name, value, sectionName) {
    if (typeof name !== 'string' || name.length === 0 || name.trim() !== name) {
      throw new TypeError(
        'MagicTower.' + sectionName + ' registration name must be a non-empty trimmed string.'
      );
    }
    if (value === undefined) {
      throw new TypeError(
        'MagicTower.' + sectionName + ' registration "' + name + '" cannot be undefined.'
      );
    }
  }

  function register(section, sectionName, name, value, freezeValue) {
    validateRegistration(name, value, sectionName);

    if (hasOwn.call(section, name)) {
      throw new Error(
        'MagicTower.' + sectionName + ' registration "' + name + '" already exists.'
      );
    }

    var registeredValue = freezeValue ? deepFreeze(value) : value;
    Object.defineProperty(section, name, {
      configurable: false,
      enumerable: true,
      value: registeredValue,
      writable: false,
    });
    return registeredValue;
  }

  var data = createSection();
  var behaviors = createSection();
  var systems = createSection();
  var ui = createSection();
  var runtime = createSection();

  /**
   * @typedef {object} MagicTowerNamespace
   * @property {Record<string, unknown>} data Immutable content catalogs.
   * @property {Record<string, unknown>} behaviors Named behavior registries.
   * @property {Record<string, unknown>} systems Domain systems.
   * @property {Record<string, unknown>} ui Browser-facing adapters.
   * @property {Record<string, unknown>} runtime Mutable runtime services/state holders.
   * @property {(category: string, value: unknown) => unknown} registerData
   * @property {(category: string, value: unknown) => unknown} registerBehavior
   * @property {(name: string, value: unknown) => unknown} registerSystem
   * @property {(name: string, value: unknown) => unknown} registerUi
   * @property {(name: string, value: unknown) => unknown} registerRuntime
   * @property {<T>(value: T) => T} deepFreeze
   */

  /** @type {MagicTowerNamespace} */
  var MagicTower = {
    data: data,
    behaviors: behaviors,
    systems: systems,
    ui: ui,
    runtime: runtime,
    registerData: function registerData(category, value) {
      return register(data, 'data', category, value, true);
    },
    registerBehavior: function registerBehavior(category, value) {
      return register(behaviors, 'behaviors', category, value, false);
    },
    registerSystem: function registerSystem(name, value) {
      return register(systems, 'systems', name, value, false);
    },
    registerUi: function registerUi(name, value) {
      return register(ui, 'ui', name, value, false);
    },
    registerRuntime: function registerRuntime(name, value) {
      return register(runtime, 'runtime', name, value, false);
    },
    deepFreeze: deepFreeze,
  };

  Object.freeze(MagicTower);
  Object.defineProperty(root, 'MagicTower', {
    configurable: false,
    enumerable: true,
    value: MagicTower,
    writable: false,
  });
})(globalThis);
