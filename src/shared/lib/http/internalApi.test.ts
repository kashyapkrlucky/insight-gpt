import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const externalApiMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("@/shared/lib/http/externalApi", () => ({
  default: externalApiMock,
}));

import useAuthStore from "@/features/auth/store/useAuthStore";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
} from "@/features/auth/utils";
import type { IUser } from "@/features/auth/types";
import internalApi from "./internalApi";

const mockUser: IUser = {
  _id: "user-1",
  avatar: "",
  avatarId: "",
  createdAt: "2026-06-22T00:00:00.000Z",
  email: "user@example.com",
  id: "user-1",
  name: "Test User",
  status: "active",
  updatedAt: "2026-06-22T00:00:00.000Z",
  username: "test-user",
};

const createUnauthorizedError = (config: InternalAxiosRequestConfig) => {
  const response: AxiosResponse = {
    config,
    data: { error: "Unauthorized" },
    headers: {},
    status: 401,
    statusText: "Unauthorized",
  };

  return new AxiosError(
    "Unauthorized",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    response,
  );
};

describe("internalApi auth refresh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    externalApiMock.post.mockReset();

    localStorage.setItem(ACCESS_TOKEN_KEY, "expired-access-token");
    localStorage.setItem(REFRESH_TOKEN_KEY, "invalid-refresh-token");
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));

    useAuthStore.setState({
      access_token: "expired-access-token",
      error: null,
      isAuthenticated: true,
      isGuestLoading: false,
      loading: false,
      refresh_token: "invalid-refresh-token",
      user: mockUser,
    });
  });

  it("logs the user out when refreshing tokens fails with a 401", async () => {
    window.history.pushState({}, "", "/login");

    externalApiMock.post.mockRejectedValueOnce(
      new AxiosError("Invalid refresh token", AxiosError.ERR_BAD_REQUEST),
    );

    internalApi.defaults.adapter = async (config) => {
      throw createUnauthorizedError(config);
    };

    await expect(internalApi.get("/v1/chats")).rejects.toThrow(
      "Invalid refresh token",
    );

    expect(externalApiMock.post).toHaveBeenCalledWith(
      "/v1/modules/session/refresh",
      { refresh_token: "invalid-refresh-token" },
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});
