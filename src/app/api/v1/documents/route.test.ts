// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, routeContext, USER } from "@/test/api";

const mocks = vi.hoisted(() => ({
  getAuthUser: vi.fn(),
  prisma: {
    document: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    chat: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  storage: {
    getFileInfo: vi.fn(),
    deleteFile: vi.fn(),
    createSignedUploadUrl: vi.fn(),
  },
  trigger: vi.fn(),
}));

vi.mock("@/features/auth/server/jwt", () => ({
  getAuthUser: mocks.getAuthUser,
}));
vi.mock("@/infra/db/connect", () => ({ prisma: mocks.prisma }));
vi.mock("@/infra/storage/services/StorageServerService", () => ({
  storageServerService: mocks.storage,
}));
vi.mock("@/jobs/document/getUploadedFile", () => ({
  getUploadedFile: { trigger: mocks.trigger },
}));

import { POST } from "./route";
import { POST as POST_UPLOAD_URL } from "./upload-url/route";
import { resetRateLimits } from "@/shared/lib/api/rateLimit";

const OWN_PATH = `${USER.id}/3f2b8c1e-4a5d-4e6f-9a0b-1c2d3e4f5a6b.pdf`;

const post = (body: unknown) =>
  POST(makeRequest("/api/v1/documents", { method: "POST", body }), routeContext());

describe("POST /api/v1/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
    mocks.getAuthUser.mockResolvedValue(USER);
    mocks.storage.getFileInfo.mockResolvedValue({
      id: "file-1",
      size: 1024,
      contentType: "application/pdf",
    });
    mocks.prisma.document.findFirst.mockResolvedValue(null);
    mocks.prisma.document.create.mockResolvedValue({ id: "doc-1" });
    mocks.prisma.chat.create.mockResolvedValue({ id: "chat-1" });
    mocks.prisma.$transaction.mockImplementation((fn) => fn(mocks.prisma));
    mocks.trigger.mockResolvedValue({ id: "run-1", publicAccessToken: "pat" });
  });

  it("returns 401 without a valid token", async () => {
    mocks.getAuthUser.mockResolvedValue(null);
    const res = await post({ path: OWN_PATH, name: "a.pdf" });
    expect(res.status).toBe(401);
  });

  it("rejects another user's storage path without touching storage", async () => {
    const res = await post({
      path: `victim/3f2b8c1e-4a5d-4e6f-9a0b-1c2d3e4f5a6b.pdf`,
      name: "a.pdf",
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid upload path" });
    expect(mocks.storage.getFileInfo).not.toHaveBeenCalled();
    expect(mocks.trigger).not.toHaveBeenCalled();
  });

  it("rejects invalid bodies", async () => {
    expect((await post({ name: "a.pdf" })).status).toBe(400);
    expect((await post("{not json")).status).toBe(400);
  });

  it("rejects a path whose object was never uploaded", async () => {
    mocks.storage.getFileInfo.mockResolvedValue(null);
    const res = await post({ path: OWN_PATH, name: "a.pdf" });
    expect(res.status).toBe(400);
  });

  it("rejects and deletes non-PDF or oversized uploads", async () => {
    mocks.storage.getFileInfo.mockResolvedValue({
      id: "f",
      size: 10,
      contentType: "text/html",
    });
    expect((await post({ path: OWN_PATH, name: "a.pdf" })).status).toBe(400);

    mocks.storage.getFileInfo.mockResolvedValue({
      id: "f",
      size: 500 * 1024 * 1024,
      contentType: "application/pdf",
    });
    expect((await post({ path: OWN_PATH, name: "a.pdf" })).status).toBe(400);
    expect(mocks.storage.deleteFile).toHaveBeenCalledTimes(2);
  });

  it("rejects registering the same upload twice", async () => {
    mocks.prisma.document.findFirst.mockResolvedValue({ id: "doc-0" });
    const res = await post({ path: OWN_PATH, name: "a.pdf" });
    expect(res.status).toBe(409);
  });

  it("creates the document and chat and starts indexing", async () => {
    const res = await post({ path: OWN_PATH, name: "  report.pdf " });

    expect(res.status).toBe(201);
    expect(mocks.prisma.document.create).toHaveBeenCalledWith({
      data: {
        fileId: "file-1",
        userId: USER.id,
        name: "report.pdf",
        size: 1024,
        type: "application/pdf",
        url: OWN_PATH,
      },
    });
    expect(mocks.trigger).toHaveBeenCalledWith({
      fileUrl: OWN_PATH,
      userId: USER.id,
      documentId: "doc-1",
    });
    expect(await res.json()).toEqual({
      document: { id: "doc-1" },
      chat: { id: "chat-1" },
      trigger: { id: "run-1", publicAccessToken: "pat" },
    });
  });

  it("marks the document failed when the job can't be queued", async () => {
    mocks.trigger.mockRejectedValue(new Error("trigger down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await post({ path: OWN_PATH, name: "a.pdf" });

    expect(res.status).toBe(502);
    expect(mocks.prisma.document.update).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      data: { status: "failed" },
    });
  });
});

describe("POST /api/v1/documents/upload-url", () => {
  const postUploadUrl = (body: unknown) =>
    POST_UPLOAD_URL(
      makeRequest("/api/v1/documents/upload-url", { method: "POST", body }),
      routeContext(),
    );

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
    mocks.getAuthUser.mockResolvedValue(USER);
    mocks.storage.createSignedUploadUrl.mockImplementation(
      async (path: string) => ({ path, token: "signed-token" }),
    );
  });

  it("issues a signed URL for a path inside the caller's folder", async () => {
    const res = await postUploadUrl({
      name: "a.pdf",
      size: 1000,
      type: "application/pdf",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("signed-token");
    expect(body.path).toMatch(new RegExp(`^${USER.id}/[0-9a-f-]{36}\\.pdf$`));
  });

  it.each([
    ["a non-PDF type", { name: "a.png", size: 1000, type: "image/png" }],
    [
      "an oversized file",
      { name: "a.pdf", size: 51 * 1024 * 1024, type: "application/pdf" },
    ],
    ["an empty name", { name: "  ", size: 1000, type: "application/pdf" }],
  ])("rejects %s", async (_label, body) => {
    const res = await postUploadUrl(body);
    expect(res.status).toBe(400);
    expect(mocks.storage.createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("rate limits guests", async () => {
    mocks.getAuthUser.mockResolvedValue({ id: "guest-1", role: "guest" });
    const body = { name: "a.pdf", size: 1000, type: "application/pdf" };

    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await postUploadUrl(body)).status);

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
