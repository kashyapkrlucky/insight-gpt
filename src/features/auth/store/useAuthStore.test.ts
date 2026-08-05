import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const externalApiMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("@/shared/lib/http/externalApi", () => ({
  default: externalApiMock,
}));

import useAuthStore from "./useAuthStore";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
} from "../utils";
import type { IUser } from "../types";

const mockUser: IUser = {
  _id: "user-1",
  id: "user-1",
  name: "Test User",
  email: "user@example.com",
  username: "test-user",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const initialState = useAuthStore.getState();

describe("useAuthStore", () => {
  beforeEach(() => {
    externalApiMock.post.mockReset();
    localStorage.clear();
    useAuthStore.setState(initialState, true);
  });

  describe("getUserData", () => {
    it("stores the user and tokens on success", async () => {
      externalApiMock.post.mockResolvedValueOnce({
        data: {
          data: {
            user: mockUser,
            access_token: "access-1",
            refresh_token: "refresh-1",
          },
        },
      });

      const result = await useAuthStore.getState().getUserData("auth-code");

      expect(externalApiMock.post).toHaveBeenCalledWith("/v1/public/session", {
        code: "auth-code",
      });
      expect(result).toEqual({
        user: mockUser,
        access_token: "access-1",
        refresh_token: "refresh-1",
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access-1");
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh-1");
      expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toEqual(mockUser);
    });

    it("sets an error and returns null on failure", async () => {
      externalApiMock.post.mockRejectedValueOnce(new Error("network down"));

      const result = await useAuthStore.getState().getUserData("bad-code");

      expect(result).toBeNull();
      expect(useAuthStore.getState().error).toBe("network down");
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe("onGuestLogin", () => {
    it("stores the user and tokens on success", async () => {
      externalApiMock.post.mockResolvedValueOnce({
        data: {
          data: {
            user: mockUser,
            access_token: "guest-access",
            refresh_token: "guest-refresh",
          },
        },
      });

      const result = await useAuthStore.getState().onGuestLogin();

      expect(result?.access_token).toBe("guest-access");
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isGuestLoading).toBe(false);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("guest-access");
    });

    it("sets an error and returns null on failure", async () => {
      externalApiMock.post.mockRejectedValueOnce(new Error("guest login failed"));

      const result = await useAuthStore.getState().onGuestLogin();

      expect(result).toBeNull();
      expect(useAuthStore.getState().error).toBe("guest login failed");
      expect(useAuthStore.getState().isGuestLoading).toBe(false);
    });
  });

  describe("getRefreshedTokens", () => {
    it("throws when there is no stored refresh token", async () => {
      await expect(useAuthStore.getState().getRefreshedTokens()).rejects.toThrow(
        "Refresh token is missing.",
      );
    });

    it("updates and persists new tokens on success", async () => {
      localStorage.setItem(REFRESH_TOKEN_KEY, "old-refresh");

      externalApiMock.post.mockResolvedValueOnce({
        data: {
          data: { access_token: "new-access", refresh_token: "new-refresh" },
        },
      });

      const result = await useAuthStore.getState().getRefreshedTokens();

      expect(externalApiMock.post).toHaveBeenCalledWith(
        "/v1/public/session/refresh",
        { refresh_token: "old-refresh" },
      );
      expect(result).toEqual({
        access_token: "new-access",
        refresh_token: "new-refresh",
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("new-access");
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("new-refresh");
    });

    it("propagates the error when the refresh request fails", async () => {
      localStorage.setItem(REFRESH_TOKEN_KEY, "old-refresh");
      const refreshError = new AxiosError("Invalid refresh token");
      externalApiMock.post.mockRejectedValueOnce(refreshError);

      await expect(useAuthStore.getState().getRefreshedTokens()).rejects.toBe(
        refreshError,
      );
    });
  });

  describe("logout", () => {
    it("clears stored tokens/user and resets auth state", () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, "access");
      localStorage.setItem(REFRESH_TOKEN_KEY, "refresh");
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      useAuthStore.setState({
        user: mockUser,
        access_token: "access",
        refresh_token: "refresh",
        isAuthenticated: true,
        error: "some previous error",
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.access_token).toBeNull();
      expect(state.refresh_token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });
  });

  describe("initialize", () => {
    it("hydrates state from localStorage when a token and user are present", async () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, "stored-access");
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.access_token).toBe("stored-access");
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
    });

    it("leaves state unauthenticated when nothing is stored", async () => {
      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe("clearError", () => {
    it("resets the error field to null", () => {
      useAuthStore.setState({ error: "oops" });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("getLoggedInUser / getToken", () => {
    it("reads the user and token from localStorage", () => {
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(ACCESS_TOKEN_KEY, "the-token");

      expect(useAuthStore.getState().getLoggedInUser()).toEqual(mockUser);
      expect(useAuthStore.getState().getToken()).toBe("the-token");
    });

    it("returns null when nothing is stored", () => {
      expect(useAuthStore.getState().getLoggedInUser()).toBeNull();
      expect(useAuthStore.getState().getToken()).toBeNull();
    });
  });
});
