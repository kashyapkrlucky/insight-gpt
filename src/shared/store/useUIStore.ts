import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

const THEME_KEY = "theme";
const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const readStorage = (key: string) => {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode). The setting just won't persist.
  }
};

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

/** Applies the theme to <html>. The same logic runs inline in the root layout before first paint. */
export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
};

const initialTheme = (): Theme => {
  const stored = readStorage(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
};

interface UIStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;

  /** Mobile drawer. */
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  /** Desktop sidebar collapse. */
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    writeStorage(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  isSidebarOpen: false,
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),

  isSidebarCollapsed: readStorage(SIDEBAR_COLLAPSED_KEY) === "true",
  toggleSidebarCollapsed: () => {
    const next = !get().isSidebarCollapsed;
    writeStorage(SIDEBAR_COLLAPSED_KEY, String(next));
    set({ isSidebarCollapsed: next });
  },
}));

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
