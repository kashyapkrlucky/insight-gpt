// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GUEST, makeRequest, routeContext, USER } from "@/test/api";

const mocks = vi.hoisted(() => ({
  getAuthUser: vi.fn(),
  prisma: {
    chat: { findFirst: vi.fn() },
    message: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  embedQuery: vi.fn(),
  retrieveChunks: vi.fn(),
  streamAnswer: vi.fn(),
}));

vi.mock("@/features/auth/server/jwt", () => ({
  getAuthUser: mocks.getAuthUser,
}));
vi.mock("@/infra/db/connect", () => ({ prisma: mocks.prisma }));
vi.mock("@/features/rag/embedQuery", () => ({ embedQuery: mocks.embedQuery }));
vi.mock("@/features/rag/retrieve", () => ({
  retrieveChunks: mocks.retrieveChunks,
}));
vi.mock("@/features/rag/generateAnswer", () => ({
  streamAnswer: mocks.streamAnswer,
}));

async function* yieldAll(parts: string[]) {
  for (const part of parts) yield part;
}

async function* failAfter(parts: string[]) {
  yield* yieldAll(parts);
  throw new Error("openai down");
}

const readEvents = async (res: Response) =>
  (await res.text())
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

import { POST } from "./route";
import { resetRateLimits } from "@/shared/lib/api/rateLimit";
import { MAX_MESSAGE_CHARS } from "@/shared/constants";

const search = (body: unknown) =>
  POST(makeRequest("/api/v1/search", { method: "POST", body }), routeContext());

describe("POST /api/v1/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
    mocks.getAuthUser.mockResolvedValue(USER);
    mocks.prisma.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      documentId: "doc-1",
      userId: USER.id,
      document: { status: "ready" },
    });
    mocks.embedQuery.mockResolvedValue([0.1, 0.2]);
    mocks.retrieveChunks.mockResolvedValue([{ payload: { content: "ctx" } }]);
    mocks.streamAnswer.mockImplementation(() => yieldAll(["The ", "answer"]));
    mocks.prisma.message.create.mockImplementation(({ data }) => data);
    mocks.prisma.$transaction.mockImplementation((ops) => Promise.all(ops));
  });

  it("returns 401 without a token", async () => {
    mocks.getAuthUser.mockResolvedValue(null);
    expect((await search({ chatId: "chat-1", question: "hi" })).status).toBe(401);
  });

  it.each([
    ["a missing question", { chatId: "chat-1" }],
    ["a blank question", { chatId: "chat-1", question: "   " }],
    [
      "an overlong question",
      { chatId: "chat-1", question: "x".repeat(MAX_MESSAGE_CHARS + 1) },
    ],
    ["a missing chatId", { question: "hi" }],
  ])("rejects %s", async (_label, body) => {
    expect((await search(body)).status).toBe(400);
    expect(mocks.streamAnswer).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's chat without calling the AI", async () => {
    mocks.prisma.chat.findFirst.mockResolvedValue(null);

    const res = await search({ chatId: "other", question: "hi" });

    expect(res.status).toBe(404);
    expect(mocks.prisma.chat.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "other", userId: USER.id } }),
    );
    expect(mocks.embedQuery).not.toHaveBeenCalled();
  });

  it("returns 409 when the document failed to process", async () => {
    mocks.prisma.chat.findFirst.mockResolvedValue({
      id: "chat-1",
      documentId: "doc-1",
      document: { status: "failed" },
    });
    expect((await search({ chatId: "chat-1", question: "hi" })).status).toBe(409);
  });

  it("streams deltas, then saves both messages and sends done", async () => {
    const res = await search({ chatId: "chat-1", question: "  What? " });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    const events = await readEvents(res);

    expect(events.slice(0, 2)).toEqual([
      { type: "delta", text: "The " },
      { type: "delta", text: "answer" },
    ]);
    expect(events[2]).toMatchObject({
      type: "done",
      message: { author: "assistant", content: "The answer" },
    });
    expect(mocks.retrieveChunks).toHaveBeenCalledWith([0.1, 0.2], "doc-1", USER.id);
    expect(mocks.streamAnswer).toHaveBeenCalledWith(
      expect.any(String),
      "What?",
      expect.any(AbortSignal),
    );
    expect(mocks.prisma.message.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({ author: "user", content: "What?" }),
    });
  });

  it("returns a JSON 502 when retrieval fails, before streaming", async () => {
    mocks.embedQuery.mockRejectedValue(new Error("qdrant down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await search({ chatId: "chat-1", question: "hi" });

    expect(res.status).toBe(502);
    expect(mocks.streamAnswer).not.toHaveBeenCalled();
  });

  it("sends an error event and saves nothing when generation fails", async () => {
    mocks.streamAnswer.mockImplementation(() => failAfter(["Par"]));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const events = await readEvents(
      await search({ chatId: "chat-1", question: "hi" }),
    );

    expect(events.at(-1)).toEqual({
      type: "error",
      error: "Failed to generate an answer. Please try again.",
    });
    expect(mocks.prisma.message.create).not.toHaveBeenCalled();
  });

  it("sends an error event for an empty model response", async () => {
    mocks.streamAnswer.mockImplementation(() => yieldAll([]));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const events = await readEvents(
      await search({ chatId: "chat-1", question: "hi" }),
    );

    expect(events).toEqual([
      { type: "error", error: "Failed to generate an answer. Please try again." },
    ]);
    expect(mocks.prisma.message.create).not.toHaveBeenCalled();
  });

  it("rate limits guests with a Retry-After header", async () => {
    mocks.getAuthUser.mockResolvedValue(GUEST);

    let last: Response | undefined;
    for (let i = 0; i < 11; i++) {
      last = await search({ chatId: "chat-1", question: "hi" });
    }

    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toBeTruthy();
  });
});
