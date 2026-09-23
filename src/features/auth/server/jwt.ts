import "server-only";
import { createPublicKey } from "crypto";
import { importSPKI, jwtVerify, type JWTPayload, type KeyLike } from "jose";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_KEY } from "../utils";

export type AuthUser = {
  id: string;
  role: string;
};

type AccessTokenPayload = JWTPayload & {
  role?: unknown;
  type?: unknown;
};

const DEFAULT_ISSUER = "atlas-id";
const CLOCK_TOLERANCE_SECONDS = 5;

let publicKeyPromise: Promise<KeyLike> | undefined;
let cachedPublicKeyPem: string | undefined;

const normalizePem = (pem: string) => {
  const trimmed = pem.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
};

const getPublicKey = () => {
  const publicKeyPem = process.env.JWT_PUBLIC_KEY;
  if (!publicKeyPem) {
    throw new Error("JWT_PUBLIC_KEY is not set in environment variables");
  }

  // Re-import if the configured key changes (e.g. key rotation in tests).
  if (publicKeyPem !== cachedPublicKeyPem) {
    cachedPublicKeyPem = publicKeyPem;
    const normalizedPublicKey = normalizePem(publicKeyPem);
    publicKeyPromise = normalizedPublicKey.includes(
      "-----BEGIN RSA PUBLIC KEY-----",
    )
      ? Promise.resolve(createPublicKey(normalizedPublicKey) as KeyLike)
      : importSPKI(normalizedPublicKey, "RS256");
  }

  return publicKeyPromise!;
};

/**
 * Audiences this app accepts. Atlas ID sets `aud` to the OAuth client id, so
 * this defaults to NEXT_PUBLIC_CLIENT_ID. JWT_AUDIENCE (comma-separated)
 * overrides it.
 */
const getAllowedAudiences = () => {
  const raw = process.env.JWT_AUDIENCE || process.env.NEXT_PUBLIC_CLIENT_ID;
  const audiences = (raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (audiences.length === 0) {
    throw new Error(
      "JWT_AUDIENCE or NEXT_PUBLIC_CLIENT_ID must be set to verify tokens",
    );
  }
  return audiences;
};

/**
 * Verify an Atlas ID access token: signature, algorithm, issuer, audience and
 * expiry. Refresh tokens are signed with the same key, so they are rejected
 * explicitly by their `type` claim.
 */
export const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify<AccessTokenPayload>(
      token,
      await getPublicKey(),
      {
        algorithms: ["RS256"],
        issuer: process.env.JWT_ISSUER || DEFAULT_ISSUER,
        audience: getAllowedAudiences(),
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
        requiredClaims: ["sub", "exp"],
      },
    );

    if (payload.type === "refresh") {
      return { payload: null, error: "Invalid or expired token" };
    }

    return { payload, error: null };
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "Access token rejected:",
        error instanceof Error ? error.message : error,
      );
    }
    return { payload: null, error: "Invalid or expired token" };
  }
};

const getTokenFromRequest = (request: NextRequest) => {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }
  return request.cookies.get(ACCESS_TOKEN_KEY)?.value;
};

/**
 * Resolve the authenticated user from the Authorization header (or the
 * access_token cookie). Returns null when missing or invalid.
 */
export const getAuthUser = async (
  request: NextRequest,
): Promise<AuthUser | null> => {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const { payload, error } = await verifyAccessToken(token);
  if (error || !payload?.sub) return null;

  return {
    id: payload.sub,
    role: typeof payload.role === "string" ? payload.role : "user",
  };
};
