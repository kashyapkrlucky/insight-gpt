import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  ACCESS_TOKEN_KEY,
  getCodeFromURL,
  getStoredToken,
  REFRESH_TOKEN_KEY,
  setStoredToken,
  TOKEN_KEY,
} from "./index";

describe("token storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getStoredToken", () => {
    it("returns null when nothing is stored", () => {
      expect(getStoredToken(ACCESS_TOKEN_KEY)).toBeNull();
    });

    it("returns the stored value for a given key", () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, "some-token");
      expect(getStoredToken(ACCESS_TOKEN_KEY)).toBe("some-token");
    });
  });

  describe("setStoredToken", () => {
    it("stores a string value under the given key", () => {
      setStoredToken(REFRESH_TOKEN_KEY, "refresh-value");
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh-value");
    });

    it("stringifies an object value before storing", () => {
      setStoredToken(TOKEN_KEY, { id: 1 });
      expect(localStorage.getItem(TOKEN_KEY)).toBe(JSON.stringify({ id: 1 }));
    });

    it("removes the key when data is null", () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, "some-token");
      setStoredToken(ACCESS_TOKEN_KEY, null);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    });

    it("defaults to TOKEN_KEY when no key is provided", () => {
      setStoredToken(undefined, "default-token");
      expect(localStorage.getItem(TOKEN_KEY)).toBe("default-token");
    });
  });
});

describe("getCodeFromURL", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("returns the 'c' query param and strips it from the URL", () => {
    window.history.pushState({}, "", "/callback?c=abc123");
    expect(getCodeFromURL()).toBe("abc123");
    expect(window.location.search).toBe("");
  });

  it("returns null when no code param is present", () => {
    window.history.pushState({}, "", "/callback");
    expect(getCodeFromURL()).toBeNull();
  });
});
