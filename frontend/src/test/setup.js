import '@testing-library/jest-dom/vitest';

const createStorageMock = () => {
  let store = new Map();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map();
    },
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
};

Object.defineProperty(globalThis, 'localStorage', {
  value: createStorageMock(),
  configurable: true,
});
