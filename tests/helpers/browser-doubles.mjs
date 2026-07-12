function createClassList() {
  const values = new Set();
  return {
    add(...tokens) {
      tokens.forEach((token) => values.add(token));
    },
    remove(...tokens) {
      tokens.forEach((token) => values.delete(token));
    },
    toggle(token, force) {
      const enabled = force === undefined ? !values.has(token) : Boolean(force);
      if (enabled) values.add(token);
      else values.delete(token);
      return enabled;
    },
    contains(token) {
      return values.has(token);
    },
  };
}

function createElement(id = "") {
  const listeners = Object.create(null);
  return {
    id,
    className: "",
    classList: createClassList(),
    children: [],
    disabled: false,
    hidden: false,
    innerHTML: "",
    scrollHeight: 0,
    scrollTop: 0,
    style: Object.create(null),
    textContent: "",
    type: "",
    addEventListener(type, listener) {
      (listeners[type] ||= []).push(listener);
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    dispatch(type, event = {}) {
      (listeners[type] || []).forEach((listener) => listener(event));
    },
    _listeners: listeners,
  };
}

export function createBrowserDoubles() {
  const elements = new Map();
  const context2d = {
    arc() {},
    beginPath() {},
    clearRect() {},
    fill() {},
    fillRect() {},
    fillText() {},
    lineTo() {},
    moveTo() {},
    stroke() {},
    strokeRect() {},
  };

  function elementById(id) {
    if (!elements.has(id)) {
      const element = createElement(id);
      if (id === "gameCanvas") {
        element.width = 880;
        element.height = 550;
        element.getContext = () => context2d;
      }
      elements.set(id, element);
    }
    return elements.get(id);
  }

  const documentListeners = Object.create(null);
  const document = {
    addEventListener(type, listener) {
      (documentListeners[type] ||= []).push(listener);
    },
    createElement: () => createElement(),
    getElementById: elementById,
    dispatch(type, event = {}) {
      (documentListeners[type] || []).forEach((listener) => listener(event));
    },
  };

  return {
    context2d,
    document,
    elements,
    globals: {
      document,
      requestAnimationFrame() {
        return 1;
      },
    },
  };
}
