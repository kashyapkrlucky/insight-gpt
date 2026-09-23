// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import {
  consumeRateLimit,
  enforceRateLimit,
  resetRateLimits,
  type RateLimitRule,
} from "./rateLimit";

const rule: RateLimitRule = {
  name: "test",
  limit: 3,
  guestLimit: 1,
  windowMs: 60_000,
};

describe("rate limiting", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit, then blocks", () => {
    const now = 1_000;
    const results = Array.from({ length: 4 }, () =>
      consumeRateLimit(rule, "user-1", { now }),
    );
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBe(60);
  });

  it("applies the lower guest limit", () => {
    expect(consumeRateLimit(rule, "g", { isGuest: true }).allowed).toBe(true);
    expect(consumeRateLimit(rule, "g", { isGuest: true }).allowed).toBe(false);
  });

  it("counts each subject separately", () => {
    for (let i = 0; i < 3; i++) consumeRateLimit(rule, "user-1");
    expect(consumeRateLimit(rule, "user-2").allowed).toBe(true);
  });

  it("resets after the window", () => {
    for (let i = 0; i < 4; i++) consumeRateLimit(rule, "u", { now: 0 });
    expect(consumeRateLimit(rule, "u", { now: 60_000 }).allowed).toBe(true);
  });

  it("throws a 429 ApiError with Retry-After when exceeded", () => {
    enforceRateLimit(rule, "g", { isGuest: true });
    try {
      enforceRateLimit(rule, "g", { isGuest: true });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(429);
      expect((error as ApiError).headers?.["Retry-After"]).toBeDefined();
    }
  });
});
