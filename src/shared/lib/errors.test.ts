import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errors";

const createAxiosError = (
  status: number,
  data?: unknown,
  message = "Request failed",
) => {
  return new AxiosError(
    message,
    String(status),
    { headers: new AxiosHeaders() },
    undefined,
    {
      config: { headers: new AxiosHeaders() },
      data,
      headers: {},
      status,
      statusText: "Error",
    },
  );
};

describe("getErrorMessage", () => {
  it("returns the response's message field when present", () => {
    const error = createAxiosError(400, { message: "Invalid input" });
    expect(getErrorMessage(error)).toBe("Invalid input");
  });

  it("returns the response's error field when message is absent", () => {
    const error = createAxiosError(400, { error: "Bad request" });
    expect(getErrorMessage(error)).toBe("Bad request");
  });

  it("returns a friendly session-expired message for 401 with no message/error field", () => {
    const error = createAxiosError(401, { foo: "bar" });
    expect(getErrorMessage(error)).toBe(
      "Your session has expired. Please sign in again.",
    );
  });

  it("falls back to the Axios error's own message when the response has no usable data", () => {
    const error = createAxiosError(500, undefined, "Network exploded");
    expect(getErrorMessage(error)).toBe("Network exploded");
  });

  it("returns the message of a plain Error", () => {
    expect(getErrorMessage(new Error("Something broke"))).toBe(
      "Something broke",
    );
  });

  it("returns the provided fallback for unrecognized error shapes", () => {
    expect(getErrorMessage("just a string", "Fallback message")).toBe(
      "Fallback message",
    );
  });

  it("returns the default fallback when none is provided", () => {
    expect(getErrorMessage({})).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
