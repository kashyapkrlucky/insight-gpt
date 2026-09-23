import "server-only";
import { ApiError } from "./errors";

export type RateLimitRule = {
  /** Unique name, used to namespace counters. */
  name: string;
  /** Max requests per window for signed-in users. */
  limit: number;
  /** Max requests per window for guest users (defaults to `limit`). */
  guestLimit?: number;
  windowMs: number;
};

type Bucket = { count: number; resetAt: number };

const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

const sweepExpired = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

/**
 * Fixed-window, in-memory rate limiter.
 *
 * Counters live in the memory of one server instance, so on a multi-instance
 * or serverless deployment each instance limits separately. Swap this for a
 * shared store (e.g. Upstash Redis) before relying on it in production.
 */
export const consumeRateLimit = (
  rule: RateLimitRule,
  subject: string,
  { isGuest = false, now = Date.now() }: { isGuest?: boolean; now?: number } = {},
) => {
  const limit = isGuest ? (rule.guestLimit ?? rule.limit) : rule.limit;
  const key = `${rule.name}:${subject}`;

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) sweepExpired(now);
    bucket = { count: 0, resetAt: now + rule.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds,
  };
};

export const enforceRateLimit = (
  rule: RateLimitRule,
  subject: string,
  options?: { isGuest?: boolean },
) => {
  const result = consumeRateLimit(rule, subject, options);
  if (!result.allowed) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      { "Retry-After": String(result.retryAfterSeconds) },
    );
  }
};

/** Test helper. */
export const resetRateLimits = () => buckets.clear();

export const RATE_LIMITS = {
  search: {
    name: "search",
    limit: 30,
    guestLimit: 10,
    windowMs: 60_000,
  },
  upload: {
    name: "upload",
    limit: 20,
    guestLimit: 5,
    windowMs: 60 * 60_000,
  },
} satisfies Record<string, RateLimitRule>;
