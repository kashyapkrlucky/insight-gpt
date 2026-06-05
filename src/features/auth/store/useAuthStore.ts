import { create } from "zustand";

import axios from "@/shared/lib/axios";

import { getStoredToken, setStoredToken, TOKEN_KEY, USER_KEY } from "../utils";
import { IUser } from "../types";

export interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isGuestLoading: boolean;
  error: string | null;
  logout: () => void;
  clearError: () => void;
  initialize: () => Promise<void>;

  getUserData: (code: string) => Promise<{ user: IUser; token: string } | null>;
  onGuestLogin: () => Promise<{ user: IUser; token: string } | null>;
  getLoggedInUser: () => IUser | null;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredToken(USER_KEY) ? JSON.parse(getStoredToken(USER_KEY)!) : null,
  token: getStoredToken(TOKEN_KEY),
  isAuthenticated: !!getStoredToken(TOKEN_KEY),
  loading: false,
  isGuestLoading: false,
  error: null,

  clearError: () => {
    set({ error: null });
  },

  initialize: async () => {
    set({ loading: true });
    try {
      const token = getStoredToken(TOKEN_KEY);
      const user = getStoredToken(USER_KEY);
      if (token && user) {
        set({ token, isAuthenticated: true, user: JSON.parse(user) });
      }
      set({ loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Initialization failed",
      });
    }
  },

  getUserData: async (code: string) => {
    try {
      set({ loading: true });
      const {
        data: { data },
      } = await axios.post("/v1/modules/session", {
        code,
      });
      const { user, token } = data;
      set({ user, token, isAuthenticated: true });
      setStoredToken(USER_KEY, JSON.stringify(user));
      setStoredToken(TOKEN_KEY, token);
      return { user, token };
    } catch {
      return null;
    } finally {
      set({ loading: false });
    }
  },

  onGuestLogin: async () => {
    try {
      set({ isGuestLoading: true });
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      const {
        data: { data },
      } = await axios.post("/v1/modules/guest", { clientUrl: baseUrl });
      const { user, token } = data;
      set({ user, token, isAuthenticated: true });
      setStoredToken(USER_KEY, JSON.stringify(user));
      setStoredToken(TOKEN_KEY, token);
      return { user, token };
    } catch {
      return null;
    } finally {
      set({ isGuestLoading: false });
    }
  },
  getLoggedInUser: () => {
    return getStoredToken(USER_KEY)
      ? JSON.parse(getStoredToken(USER_KEY)!)
      : null;
  },
  getToken: () => {
    return getStoredToken(TOKEN_KEY);
  },
  logout: () => {
    setStoredToken(TOKEN_KEY, null);
    setStoredToken(USER_KEY, null);
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },
}));

export default useAuthStore;
