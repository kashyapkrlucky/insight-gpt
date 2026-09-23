// @vitest-environment node
import { NextRequest } from "next/server";
import { SignJWT, exportSPKI, generateKeyPair, type KeyLike } from "jose";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ACCESS_TOKEN_KEY } from "../utils";
import { getAuthUser, verifyAccessToken } from "./jwt";

const CLIENT_ID = "client-123";

describe("server jwt", () => {
  let privateKey: KeyLike;
  let wrongPrivateKey: KeyLike;
  let publicKeyPem: string;

  beforeAll(async () => {
    const pair = await generateKeyPair("RS256");
    privateKey = pair.privateKey;
    publicKeyPem = await exportSPKI(pair.publicKey);
    wrongPrivateKey = (await generateKeyPair("RS256")).privateKey;
  });

  beforeEach(() => {
    process.env.JWT_PUBLIC_KEY = publicKeyPem;
    process.env.NEXT_PUBLIC_CLIENT_ID = CLIENT_ID;
    delete process.env.JWT_AUDIENCE;
    delete process.env.JWT_ISSUER;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CLIENT_ID;
    delete process.env.JWT_AUDIENCE;
  });

  const signToken = (
    key: KeyLike,
    {
      sub = "user-1",
      expiresIn = "1h",
      issuer = "atlas-id",
      audience = CLIENT_ID,
      claims = { role: "user" } as Record<string, unknown>,
    } = {},
  ) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256" })
      .setSubject(sub)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(key);

  describe("verifyAccessToken", () => {
    it("accepts a valid token for this client", async () => {
      const { payload, error } = await verifyAccessToken(
        await signToken(privateKey),
      );
      expect(error).toBeNull();
      expect(payload?.sub).toBe("user-1");
    });

    it.each([
      ["signed with the wrong key", () => signToken(wrongPrivateKey)],
      ["expired", () => signToken(privateKey, { expiresIn: "-1h" })],
      ["from another issuer", () => signToken(privateKey, { issuer: "evil" })],
      [
        "issued for another client",
        () => signToken(privateKey, { audience: "other-client" }),
      ],
      [
        "a refresh token",
        () =>
          signToken(privateKey, {
            claims: { sid: "session-1", type: "refresh" },
          }),
      ],
    ])("rejects a token %s", async (_label, makeToken) => {
      const { payload, error } = await verifyAccessToken(await makeToken());
      expect(payload).toBeNull();
      expect(error).toBe("Invalid or expired token");
    });

    it("rejects a token signed with HS256", async () => {
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-1")
        .setIssuer("atlas-id")
        .setAudience(CLIENT_ID)
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode("a-shared-secret-of-sufficient-length"));

      expect((await verifyAccessToken(token)).payload).toBeNull();
    });

    it("rejects a malformed token", async () => {
      expect((await verifyAccessToken("not-a-jwt")).payload).toBeNull();
    });

    it("accepts any audience listed in JWT_AUDIENCE", async () => {
      process.env.JWT_AUDIENCE = `${CLIENT_ID}, atlas-app`;
      const token = await signToken(privateKey, { audience: "atlas-app" });
      expect((await verifyAccessToken(token)).error).toBeNull();
    });

    it("rejects everything when no audience is configured", async () => {
      delete process.env.NEXT_PUBLIC_CLIENT_ID;
      const token = await signToken(privateKey);
      expect((await verifyAccessToken(token)).payload).toBeNull();
    });

    it("rejects everything when JWT_PUBLIC_KEY is missing", async () => {
      delete process.env.JWT_PUBLIC_KEY;
      const token = await signToken(privateKey);
      expect((await verifyAccessToken(token)).payload).toBeNull();
    });
  });

  describe("getAuthUser", () => {
    it("resolves id and role from a Bearer header", async () => {
      const token = await signToken(privateKey, {
        sub: "guest-1",
        claims: { role: "guest" },
      });
      const request = new NextRequest("http://localhost/api/v1/chats", {
        headers: { authorization: `Bearer ${token}` },
      });

      expect(await getAuthUser(request)).toEqual({
        id: "guest-1",
        role: "guest",
      });
    });

    it("falls back to the access_token cookie", async () => {
      const token = await signToken(privateKey, { sub: "cookie-user" });
      const request = new NextRequest("http://localhost/api/v1/chats", {
        headers: { cookie: `${ACCESS_TOKEN_KEY}=${token}` },
      });

      expect((await getAuthUser(request))?.id).toBe("cookie-user");
    });

    it("defaults role to user when the claim is missing", async () => {
      const token = await signToken(privateKey, { claims: {} });
      const request = new NextRequest("http://localhost/api/v1/chats", {
        headers: { authorization: `Bearer ${token}` },
      });

      expect((await getAuthUser(request))?.role).toBe("user");
    });

    it("returns null without a token", async () => {
      const request = new NextRequest("http://localhost/api/v1/chats");
      expect(await getAuthUser(request)).toBeNull();
    });

    it("returns null for an invalid token", async () => {
      const request = new NextRequest("http://localhost/api/v1/chats", {
        headers: {
          authorization: `Bearer ${await signToken(wrongPrivateKey)}`,
        },
      });
      expect(await getAuthUser(request)).toBeNull();
    });
  });
});
