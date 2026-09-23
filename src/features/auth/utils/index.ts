export const TOKEN_KEY = "token";
export const USER_KEY = "user";

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

// Helper functions for token management
export const getStoredToken = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

export const setStoredToken = (
  key: string = TOKEN_KEY,
  data: object | string | null,
): void => {
  if (typeof window !== "undefined") {
    if (data) {
      localStorage.setItem(
        key,
        typeof data === "string" ? data : JSON.stringify(data),
      );
    } else {
      localStorage.removeItem(key);
    }
  }
};

export const STORAGE_KEYS = {
  tasks: "tasks",
};

export const getCodeFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("c");
  if (code) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  return code;
};
