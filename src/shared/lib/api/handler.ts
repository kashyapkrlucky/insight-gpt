import "server-only";
import type { NextRequest } from "next/server";
import type { ZodType, ZodTypeDef } from "zod";
import { getAuthUser, type AuthUser } from "@/features/auth/server/jwt";
import { badRequest, toErrorResponse, unauthorized } from "./errors";
import { enforceRateLimit, type RateLimitRule } from "./rateLimit";

type RouteContext<P> = { params: Promise<P> };

type AuthedHandler<P> = (
  request: NextRequest,
  context: { user: AuthUser; params: P },
) => Promise<Response>;

type WithAuthOptions = {
  rateLimit?: RateLimitRule;
};

/**
 * Wraps a route handler with authentication, optional per-user rate limiting,
 * and uniform error handling. Throw an ApiError (or ZodError) inside the
 * handler to return a JSON error response.
 */
export function withAuth<P = Record<string, never>>(
  handler: AuthedHandler<P>,
  options: WithAuthOptions = {},
) {
  return async (request: NextRequest, context: RouteContext<P>) => {
    try {
      const user = await getAuthUser(request);
      if (!user) throw unauthorized();

      if (options.rateLimit) {
        enforceRateLimit(options.rateLimit, user.id, {
          isGuest: user.role === "guest",
        });
      }

      const params = (await context?.params) ?? ({} as P);
      return await handler(request, { user, params });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Parse and validate a JSON request body. */
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: ZodType<T, ZodTypeDef, unknown>,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
  return schema.parse(body);
}
