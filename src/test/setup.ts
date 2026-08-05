import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { JSDOM } from "jsdom";

// Node 22+ defines its own global `localStorage`/`sessionStorage` getters
// (requiring --localstorage-file) which shadow jsdom's implementation and
// make them read as `undefined` in tests. Replace them with real jsdom
// Storage instances so `localStorage`/`sessionStorage` work as expected.
const { window: storageWindow } = new JSDOM("", { url: "http://localhost/" });

Object.defineProperty(globalThis, "localStorage", {
  value: storageWindow.localStorage,
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: storageWindow.sessionStorage,
  configurable: true,
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});
