import { ACCESS_TOKEN_KEY } from "@/features/auth/utils";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const internalApi = axios.create({
  baseURL:
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000") + "/api",
});

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

let isRefreshing = false;
let queue: {
  resolve: () => void;
  reject: (error: unknown) => void;
}[] = [];

const flushQueue = (error?: unknown) => {
  queue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
  queue = [];
};

const shouldSkipRefresh = (url?: string) => {
  if (!url) return true;

  return ["/v1/modules/session/refresh"].some((path) => url.includes(path));
};

const logoutAndRedirectToLogin = () => {
  useAuthStore.getState().logout();
  toast.error("Your session has expired. Please sign in again.", {
    id: "session-expired",
  });

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

internalApi.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
internalApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle errors globally
    if (error.response) {
      // Handle specific status codes
      if (error.response.status === 401) {
        const original = error.config as
          | RetryableAxiosRequestConfig
          | undefined;

        if (
          !original ||
          original._retry ||
          original.skipAuthRefresh ||
          shouldSkipRefresh(original.url)
        ) {
          throw error;
        }

        original._retry = true;

        if (isRefreshing) {
          await new Promise<void>((resolve, reject) => {
            queue.push({ resolve, reject });
          });
          return internalApi(original);
        }

        isRefreshing = true;

        try {
          await useAuthStore.getState().getRefreshedTokens();

          flushQueue();

          return internalApi(original);
        } catch (refreshError) {
          flushQueue(refreshError);
          logoutAndRedirectToLogin();
          throw refreshError;
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(error);
  },
);

export { AxiosError };
export default internalApi;
