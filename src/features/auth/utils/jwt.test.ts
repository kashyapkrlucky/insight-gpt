// @vitest-environment node
import { NextRequest } from "next/server";
import {
  SignJWT,
  exportSPKI,
  generateKeyPair,
  type KeyLike,
} from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_KEY,
  getUserFromHeaders,
  verifyAccessToken,
} from "./index";

describe("verifyAccessToken / getUserFromHeaders", () => {
  let privateKey: KeyLike;
  let wrongPrivateKey: KeyLike;

  beforeAll(async () => {
    const pair = await generateKeyPair("RS256");
    privateKey = pair.privateKey;
    wrongPrivateKey = (await generateKeyPair("RS256")).privateKey;
    process.env.JWT_PUBLIC_KEY = await exportSPKI(pair.publicKey);
  });

  const signToken = (
    key: KeyLike,
    { sub = "user-1", expiresIn = "1h" }: { sub?: string; expiresIn?: string } = {},
  ) => {
    return new SignJWT({})
      .setProtectedHeader({ alg: "RS256" })
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(key);
  };

  describe("verifyAccessToken", () => {
    it("returns the payload for a validly signed, unexpired token", async () => {
      const token = await signToken(privateKey);
      const { payload, error } = await verifyAccessToken(token);
      expect(error).toBeNull();
      expect(payload?.sub).toBe("user-1");
    });

    it("returns an error for a token signed with the wrong key", async () => {
      const token = await signToken(wrongPrivateKey);
      const { payload, error } = await verifyAccessToken(token);
      expect(payload).toBeNull();
      expect(error).toBe("Invalid or expired token");
    });

    it("returns an error for an expired token", async () => {
      const token = await signToken(privateKey, { expiresIn: "-1h" });
      const { payload, error } = await verifyAccessToken(token);
      expect(payload).toBeNull();
      expect(error).toBe("Invalid or expired token");
    });

    it("returns an error for a malformed token string", async () => {
      const { payload, error } = await verifyAccessToken("not-a-jwt");
      expect(payload).toBeNull();
      expect(error).toBe("Invalid or expired token");
    });

    it("returns an error when JWT_PUBLIC_KEY is not configured", async () => {
      const original = process.env.JWT_PUBLIC_KEY;
      delete process.env.JWT_PUBLIC_KEY;

      const token = await signToken(privateKey);
      const { payload, error } = await verifyAccessToken(token);

      expect(payload).toBeNull();
      expect(error).toBe("Invalid or expired token");

      process.env.JWT_PUBLIC_KEY = original;
    });
  });

  describe("getUserFromHeaders", () => {
    it("resolves the subject from a Bearer authorization header", async () => {
      const token = await signToken(privateKey, { sub: "user-from-header" });
      const request = new NextRequest("http://localhost/api/v1/chats", {
        headers: { authorization: `Bearer ${token}` },
      });

      expect(await getUserFromHeaders(request)).toBe("user-from-header");
    });

    it("falls back to the access_token cookie when no header is present", async () => {
      const token = await signToken(privateKey, { sub: "user-from-cookie" });
      const request = new NextRequest("http://localhost/api/v1/chats", {
        headers: { cookie: `${ACCESS_TOKEN_KEY}=${token}` },
      });

      expect(await getUserFromHeaders(request)).toBe("user-from-cookie");
    });

    it("returns null when no token is present in headers or cookies", async () => {
      const request = new NextRequest("http://localhost/api/v1/chats");
      expect(await getUserFromHeaders(request)).toBeNull();
    });

    it("returns null when the token fails verification", async () => {
      const token = await signToken(wrongPrivateKey);
      const request = new NextRequest("http://localhost/api/v1/chats", {
        headers: { authorization: `Bearer ${token}` },
      });

      expect(await getUserFromHeaders(request)).toBeNull();
    });
  });
});
