import { create } from "zustand";

import axios from "@/shared/lib/axios";

import { getStoredToken, setStoredToken, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from "../utils";
import { IUser } from "../types";

export interface AuthState {
  user: IUser | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isGuestLoading: boolean;
  error: string | null;
  logout: () => void;
  clearError: () => void;
  initialize: () => Promise<void>;

  getUserData: (code: string) => Promise<{ user: IUser; access_token: string; refresh_token: string } | null>;
  onGuestLogin: () => Promise<{ user: IUser; access_token: string; refresh_token: string } | null>;
  getLoggedInUser: () => IUser | null;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredToken(USER_KEY) ? JSON.parse(getStoredToken(USER_KEY)!) : null,
  access_token: getStoredToken(ACCESS_TOKEN_KEY),
  refresh_token: getStoredToken(REFRESH_TOKEN_KEY),
  isAuthenticated: !!getStoredToken(ACCESS_TOKEN_KEY),
  loading: false,
  isGuestLoading: false,
  error: null,

  clearError: () => {
    set({ error: null });
  },

  initialize: async () => {
    set({ loading: true });
    try {
      const token = getStoredToken(ACCESS_TOKEN_KEY);
      const user = getStoredToken(USER_KEY);
      if (token && user) {
        set({ access_token: token, isAuthenticated: true, user: JSON.parse(user) });
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
      const { user, access_token, refresh_token } = data;
      set({ user, access_token, refresh_token, isAuthenticated: true });
      setStoredToken(USER_KEY, JSON.stringify(user));
      setStoredToken(ACCESS_TOKEN_KEY, access_token);
      setStoredToken(REFRESH_TOKEN_KEY, refresh_token);
      return { user, access_token, refresh_token };
    } catch {
      return null;
    } finally {
      set({ loading: false });
    }
  },

  onGuestLogin: async () => {
    try {
      set({ isGuestLoading: true });
      const clientId = process.env.VITE_CLIENT_ID;
      const {
        data: { data },
      } = await axios.post("/v1/modules/guest", { clientId });
      const { user, access_token, refresh_token } = data;
      set({ user, access_token, refresh_token, isAuthenticated: true });
      setStoredToken(USER_KEY, JSON.stringify(user));
      setStoredToken(ACCESS_TOKEN_KEY, access_token);
      setStoredToken(REFRESH_TOKEN_KEY, refresh_token);
      return { user, access_token, refresh_token };
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
    return getStoredToken(ACCESS_TOKEN_KEY);
  },
  logout: () => {
    setStoredToken(ACCESS_TOKEN_KEY, null);
    setStoredToken(REFRESH_TOKEN_KEY, null);
    setStoredToken(USER_KEY, null);
    set({ user: null, access_token: null, refresh_token: null, isAuthenticated: false, error: null });
  },
}));

export default useAuthStore;
