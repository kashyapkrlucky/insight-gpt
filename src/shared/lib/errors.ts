import { isAxiosError } from "axios";

type ErrorResponseData = {
  error?: unknown;
  message?: unknown;
};

const isErrorResponseData = (data: unknown): data is ErrorResponseData => {
  return typeof data === "object" && data !== null;
};

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) => {
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (isErrorResponseData(data)) {
      if (typeof data.message === "string") return data.message;
      if (typeof data.error === "string") return data.error;
    }

    if (error.response?.status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
