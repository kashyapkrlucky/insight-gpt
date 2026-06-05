
import { formatDistance } from "date-fns";
export const TOKEN_KEY = "token";
export const USER_KEY = "user";


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

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}


export const STORAGE_KEYS = {
  tasks: "tasks",
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatDateWithTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const monthYearOnly = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
};

export const formatRelativeTime = (date: string) => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
export const asDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

// ---------------

export const getCodeFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("c");
  if (code) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  return code;
};

