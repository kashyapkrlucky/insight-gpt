import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({ getRefreshedTokens: vi.fn() }));
const logoutMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/auth/store/useAuthStore", () => ({
  useAuthStore: { getState: () => authMock },
}));
vi.mock("./internalApi", () => ({ logoutAndRedirectToLogin: logoutMock }));

import { postStream, type StreamEvent } from "./streamRequest";

const streamOf = (...chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });

describe("postStream", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    authMock.getRefreshedTokens.mockReset();
    logoutMock.mockReset();
    localStorage.setItem("access_token", "tok-1");
  });

  it("parses NDJSON events split across chunks", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        streamOf('{"type":"delta","te', 'xt":"Hi"}\n{"type":"do', 'ne","message":{"id":"m1"}}\n'),
      ),
    );
    const events: StreamEvent<{ id: string }>[] = [];

    await postStream<{ id: string }>("/v1/search", { q: 1 }, {
      onEvent: (event) => events.push(event),
    });

    expect(events).toEqual([
      { type: "delta", text: "Hi" },
      { type: "done", message: { id: "m1" } },
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/search");
    expect(init.headers.Authorization).toBe("Bearer tok-1");
    expect(init.body).toBe('{"q":1}');
  });

  it("handles a final line without a trailing newline", async () => {
    fetchMock.mockResolvedValue(new Response(streamOf('{"type":"delta","text":"x"}')));
    const onEvent = vi.fn();
    await postStream("/v1/search", {}, { onEvent });
    expect(onEvent).toHaveBeenCalledWith({ type: "delta", text: "x" });
  });

  it("throws the server's error message for non-2xx responses", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: "Chat not found" }, { status: 404 }),
    );
    await expect(
      postStream("/v1/search", {}, { onEvent: vi.fn() }),
    ).rejects.toThrow("Chat not found");
  });

  it("refreshes the session once on 401 and retries with the new token", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(streamOf('{"type":"delta","text":"ok"}\n')));
    authMock.getRefreshedTokens.mockImplementation(async () => {
      localStorage.setItem("access_token", "tok-2");
    });

    const onEvent = vi.fn();
    await postStream("/v1/search", {}, { onEvent });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer tok-2");
    expect(onEvent).toHaveBeenCalledWith({ type: "delta", text: "ok" });
  });

  it("logs out when the refresh fails", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    authMock.getRefreshedTokens.mockRejectedValue(new Error("expired"));

    await expect(
      postStream("/v1/search", {}, { onEvent: vi.fn() }),
    ).rejects.toThrow("expired");
    expect(logoutMock).toHaveBeenCalled();
  });
});
