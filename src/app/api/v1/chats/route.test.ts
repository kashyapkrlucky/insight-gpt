// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, routeContext, USER } from "@/test/api";

const mocks = vi.hoisted(() => ({
  getAuthUser: vi.fn(),
  prisma: {
    chat: { findMany: vi.fn(), findFirst: vi.fn() },
    message: { findMany: vi.fn() },
    document: { delete: vi.fn() },
  },
  removeTrigger: vi.fn(),
}));

vi.mock("@/features/auth/server/jwt", () => ({
  getAuthUser: mocks.getAuthUser,
}));
vi.mock("@/infra/db/connect", () => ({ prisma: mocks.prisma }));
vi.mock("@/jobs/document/removeUploadedFile", () => ({
  removeUploadedFile: { trigger: mocks.removeTrigger },
}));

import { GET as listChats } from "./route";
import { GET as getChat, DELETE as deleteChat } from "./[id]/route";
import { GET as listMessages } from "./[id]/messages/route";

const chat = {
  id: "chat-1",
  userId: USER.id,
  documentId: "doc-1",
  document: { id: "doc-1", url: `${USER.id}/file.pdf` },
};

describe("chat routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthUser.mockResolvedValue(USER);
  });

  it("all return 401 without a token", async () => {
    mocks.getAuthUser.mockResolvedValue(null);
    const ctx = routeContext({ id: "chat-1" });

    const responses = await Promise.all([
      listChats(makeRequest("/api/v1/chats"), routeContext()),
      getChat(makeRequest("/api/v1/chats/chat-1"), ctx),
      deleteChat(makeRequest("/api/v1/chats/chat-1", { method: "DELETE" }), ctx),
      listMessages(makeRequest("/api/v1/chats/chat-1/messages"), ctx),
    ]);

    expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401]);
    expect(mocks.prisma.chat.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.chat.findFirst).not.toHaveBeenCalled();
  });

  it("lists only the caller's chats, newest first", async () => {
    mocks.prisma.chat.findMany.mockResolvedValue([]);
    await listChats(makeRequest("/api/v1/chats"), routeContext());

    expect(mocks.prisma.chat.findMany).toHaveBeenCalledWith({
      where: { userId: USER.id },
      orderBy: { createdAt: "desc" },
      include: { document: { select: { status: true } } },
    });
  });

  it("scopes single-chat lookups to the caller", async () => {
    mocks.prisma.chat.findFirst.mockResolvedValue(null);
    const res = await getChat(
      makeRequest("/api/v1/chats/other"),
      routeContext({ id: "other" }),
    );

    expect(res.status).toBe(404);
    expect(mocks.prisma.chat.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "other", userId: USER.id } }),
    );
  });

  it("returns messages oldest first for an owned chat", async () => {
    mocks.prisma.chat.findFirst.mockResolvedValue({ id: "chat-1" });
    mocks.prisma.message.findMany.mockResolvedValue([{ id: "m1" }]);

    const res = await listMessages(
      makeRequest("/api/v1/chats/chat-1/messages"),
      routeContext({ id: "chat-1" }),
    );

    expect(await res.json()).toEqual([{ id: "m1" }]);
    expect(mocks.prisma.message.findMany).toHaveBeenCalledWith({
      where: { chatId: "chat-1" },
      orderBy: { createdAt: "asc" },
    });
  });

  it("does not return messages for another user's chat", async () => {
    mocks.prisma.chat.findFirst.mockResolvedValue(null);
    const res = await listMessages(
      makeRequest("/api/v1/chats/x/messages"),
      routeContext({ id: "x" }),
    );
    expect(res.status).toBe(404);
    expect(mocks.prisma.message.findMany).not.toHaveBeenCalled();
  });

  describe("DELETE", () => {
    const del = () =>
      deleteChat(
        makeRequest("/api/v1/chats/chat-1", { method: "DELETE" }),
        routeContext({ id: "chat-1" }),
      );

    it("returns 404 and deletes nothing for another user's chat", async () => {
      mocks.prisma.chat.findFirst.mockResolvedValue(null);
      expect((await del()).status).toBe(404);
      expect(mocks.prisma.document.delete).not.toHaveBeenCalled();
      expect(mocks.removeTrigger).not.toHaveBeenCalled();
    });

    it("deletes the document (cascading) then queues cleanup", async () => {
      mocks.prisma.chat.findFirst.mockResolvedValue(chat);

      const res = await del();

      expect(res.status).toBe(200);
      expect(mocks.prisma.document.delete).toHaveBeenCalledWith({
        where: { id: "doc-1" },
      });
      expect(mocks.removeTrigger).toHaveBeenCalledWith({
        fileUrl: chat.document.url,
        userId: USER.id,
        documentId: "doc-1",
      });
      expect(
        mocks.prisma.document.delete.mock.invocationCallOrder[0],
      ).toBeLessThan(mocks.removeTrigger.mock.invocationCallOrder[0]);
    });

    it("still succeeds if cleanup can't be queued", async () => {
      mocks.prisma.chat.findFirst.mockResolvedValue(chat);
      mocks.removeTrigger.mockRejectedValue(new Error("down"));
      vi.spyOn(console, "error").mockImplementation(() => {});

      expect((await del()).status).toBe(200);
    });
  });
});
