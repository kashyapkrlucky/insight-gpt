import { beforeEach, describe, expect, it, vi } from "vitest";

const internalApiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/shared/lib/http/internalApi", () => ({
  default: internalApiMock,
}));

const storageMock = vi.hoisted(() => ({
  validateFile: vi.fn(),
  uploadToSignedUrl: vi.fn(),
}));

vi.mock("@/infra/storage/services/StorageClientService", () => ({
  storageClientService: storageMock,
}));

const postStreamMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/http/streamRequest", () => ({
  postStream: postStreamMock,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { toProcessingStatus, useChatStore } from "./useChatStore";
import type { Chat, Message } from "../types";

const chatA: Chat = {
  id: "chat-a",
  documentId: "doc-a",
  userId: "user-1",
  title: "Chat A",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const chatB: Chat = {
  id: "chat-b",
  documentId: "doc-b",
  userId: "user-1",
  title: "Chat B",
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
};

const messageA: Message = {
  id: "msg-a",
  chatId: "chat-a",
  author: "assistant",
  content: "Hello",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const initialState = useChatStore.getState();

describe("useChatStore", () => {
  beforeEach(() => {
    internalApiMock.get.mockReset();
    internalApiMock.post.mockReset();
    internalApiMock.delete.mockReset();
    storageMock.validateFile.mockReset();
    storageMock.uploadToSignedUrl.mockReset();
    postStreamMock.mockReset();
    useChatStore.setState(initialState, true);
  });

  describe("uploadDocument", () => {
    const file = new File(["%PDF-1.7"], "report.pdf", {
      type: "application/pdf",
    });
    const path = "user-1/3f2b8c1e-4a5d-4e6f-9a0b-1c2d3e4f5a6b.pdf";

    it("gets a signed URL, uploads, then registers the document", async () => {
      internalApiMock.post
        .mockResolvedValueOnce({ data: { path, token: "tok" } })
        .mockResolvedValueOnce({
          data: {
            document: { id: "doc-a" },
            chat: chatA,
            trigger: { id: "run-1", publicAccessToken: "pat" },
          },
        });
      storageMock.uploadToSignedUrl.mockResolvedValue({ success: true });

      const result = await useChatStore.getState().uploadDocument(file);

      expect(result).toEqual(chatA);
      expect(internalApiMock.post).toHaveBeenNthCalledWith(
        1,
        "/v1/documents/upload-url",
        { name: "report.pdf", size: file.size, type: "application/pdf" },
      );
      expect(storageMock.uploadToSignedUrl).toHaveBeenCalledWith(path, "tok", file);
      expect(internalApiMock.post).toHaveBeenNthCalledWith(2, "/v1/documents", {
        path,
        name: "report.pdf",
      });

      const state = useChatStore.getState();
      expect(state.currentChat).toEqual(chatA);
      expect(state.currentFile).toBe("doc-a");
      expect(state.chats[0]).toEqual(chatA);
      expect(state.trigger).toEqual({ id: "run-1", publicAccessToken: "pat" });
      expect(state.fileProcessingStatus).toBe("processing");
      expect(state.isFileUploading).toBe(false);
    });

    it("stops before any request when the file is invalid", async () => {
      storageMock.validateFile.mockImplementation(() => {
        throw new Error("Only PDF files are supported");
      });

      const result = await useChatStore.getState().uploadDocument(file);

      expect(result).toBeNull();
      expect(internalApiMock.post).not.toHaveBeenCalled();
      expect(useChatStore.getState().error).toBe("Only PDF files are supported");
    });

    it("does not register the document when the storage upload fails", async () => {
      internalApiMock.post.mockResolvedValueOnce({ data: { path, token: "tok" } });
      storageMock.uploadToSignedUrl.mockResolvedValue({
        success: false,
        error: "Upload failed",
      });

      const result = await useChatStore.getState().uploadDocument(file);

      expect(result).toBeNull();
      expect(internalApiMock.post).toHaveBeenCalledTimes(1);
      expect(useChatStore.getState().isFileUploading).toBe(false);
    });
  });

  describe("setCurrentChat", () => {
    it("resets messages/file state when switching to a different chat", () => {
      useChatStore.setState({
        currentChat: chatA,
        messages: [messageA],
        currentFile: "file-a",
        fileProcessingStatus: "ready",
        trigger: { id: "trigger-a", publicAccessToken: "token-a" },
      });

      useChatStore.getState().setCurrentChat(chatB);

      const state = useChatStore.getState();
      expect(state.currentChat).toEqual(chatB);
      expect(state.messages).toEqual([]);
      expect(state.currentFile).toBeNull();
      expect(state.fileProcessingStatus).toBe("ready");
      expect(state.trigger).toEqual({ id: null, publicAccessToken: null });
    });

    it("preserves messages/file state when re-selecting the same chat", () => {
      useChatStore.setState({
        currentChat: chatA,
        messages: [messageA],
        currentFile: "file-a",
      });

      useChatStore.getState().setCurrentChat(chatA);

      const state = useChatStore.getState();
      expect(state.messages).toEqual([messageA]);
      expect(state.currentFile).toBe("file-a");
    });

    it("sets fileProcessingStatus to idle when clearing the current chat", () => {
      useChatStore.getState().setCurrentChat(null);
      expect(useChatStore.getState().fileProcessingStatus).toBe("idle");
    });
  });

  describe("addChat", () => {
    it("prepends a new chat and de-duplicates by id", () => {
      useChatStore.setState({ chats: [chatB] });
      useChatStore.getState().addChat(chatA);
      expect(useChatStore.getState().chats).toEqual([chatA, chatB]);
    });

    it("moves an existing chat to the front when re-added", () => {
      useChatStore.setState({ chats: [chatA, chatB] });
      useChatStore.getState().addChat(chatB);
      expect(useChatStore.getState().chats).toEqual([chatB, chatA]);
    });
  });

  describe("getChats", () => {
    it("stores the fetched chats", async () => {
      internalApiMock.get.mockResolvedValueOnce({ data: [chatA, chatB] });

      const result = await useChatStore.getState().getChats();

      expect(internalApiMock.get).toHaveBeenCalledWith("/v1/chats");
      expect(result).toEqual([chatA, chatB]);
      expect(useChatStore.getState().chats).toEqual([chatA, chatB]);
      expect(useChatStore.getState().isChatsLoading).toBe(false);
    });

    it("sets an error and returns an empty list on failure", async () => {
      internalApiMock.get.mockRejectedValueOnce(new Error("boom"));

      const result = await useChatStore.getState().getChats();

      expect(result).toEqual([]);
      expect(useChatStore.getState().error).toBe("boom");
      expect(useChatStore.getState().isChatsLoading).toBe(false);
    });
  });

  describe("getMessages", () => {
    it("stores the fetched messages for a chat", async () => {
      internalApiMock.get.mockResolvedValueOnce({ data: [messageA] });

      const result = await useChatStore.getState().getMessages("chat-a");

      expect(internalApiMock.get).toHaveBeenCalledWith(
        "/v1/chats/chat-a/messages",
      );
      expect(result).toEqual([messageA]);
      expect(useChatStore.getState().messages).toEqual([messageA]);
    });

    it("sets an error and returns an empty list on failure", async () => {
      internalApiMock.get.mockRejectedValueOnce(new Error("fetch failed"));

      const result = await useChatStore.getState().getMessages("chat-a");

      expect(result).toEqual([]);
      expect(useChatStore.getState().error).toBe("fetch failed");
    });
  });

  describe("addMessage", () => {
    it("appends a message to the existing list", () => {
      useChatStore.setState({ messages: [messageA] });
      const newMessage: Message = { ...messageA, id: "msg-b", content: "Hi" };

      useChatStore.getState().addMessage(newMessage);

      expect(useChatStore.getState().messages).toEqual([messageA, newMessage]);
    });
  });

  describe("sendMessage", () => {
    type Handler = (event: unknown) => void;
    const streamEvents =
      (...events: unknown[]) =>
      async (_path: string, _body: unknown, { onEvent }: { onEvent: Handler }) => {
        for (const event of events) onEvent(event);
      };

    it("adds the question and a streaming answer, then settles on done", async () => {
      let midStream: ReturnType<typeof useChatStore.getState>["messages"] = [];
      postStreamMock.mockImplementation(
        async (_path: string, _body: unknown, { onEvent }: { onEvent: Handler }) => {
          onEvent({ type: "delta", text: "Hel" });
          onEvent({ type: "delta", text: "lo" });
          midStream = useChatStore.getState().messages;
          onEvent({
            type: "done",
            message: { ...messageA, id: "msg-saved", content: "Hello" },
          });
        },
      );

      await useChatStore.getState().sendMessage("What is this?", "chat-a");

      expect(postStreamMock).toHaveBeenCalledWith(
        "/v1/search",
        { question: "What is this?", chatId: "chat-a" },
        expect.any(Object),
      );
      expect(midStream[1]).toMatchObject({
        author: "assistant",
        content: "Hello",
        status: "streaming",
      });

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0]).toMatchObject({
        author: "user",
        content: "What is this?",
        status: undefined,
      });
      expect(messages[1]).toMatchObject({
        id: "msg-saved",
        content: "Hello",
        status: undefined,
      });
      expect(useChatStore.getState().isSendingMessage).toBe(false);
    });

    it("marks the question failed and drops the partial answer on an error event", async () => {
      postStreamMock.mockImplementation(
        streamEvents(
          { type: "delta", text: "Par" },
          { type: "error", error: "Failed to generate an answer." },
        ),
      );

      await useChatStore.getState().sendMessage("Will fail", "chat-a");

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({ content: "Will fail", status: "failed" });
      expect(useChatStore.getState().error).toBe("Failed to generate an answer.");
      expect(useChatStore.getState().isSendingMessage).toBe(false);
    });

    it("treats a stream that ends without done as a failure", async () => {
      postStreamMock.mockImplementation(streamEvents({ type: "delta", text: "Hi" }));

      await useChatStore.getState().sendMessage("Cut off", "chat-a");

      expect(useChatStore.getState().messages).toEqual([
        expect.objectContaining({ content: "Cut off", status: "failed" }),
      ]);
    });

    it("marks the question failed when the request is rejected", async () => {
      postStreamMock.mockRejectedValue(new Error("Too many requests"));

      await useChatStore.getState().sendMessage("Hi", "chat-a");

      expect(useChatStore.getState().messages[0].status).toBe("failed");
      expect(useChatStore.getState().error).toBe("Too many requests");
    });

    it("ignores a send while another answer is in progress", async () => {
      useChatStore.setState({ isSendingMessage: true });
      await useChatStore.getState().sendMessage("Hi", "chat-a");
      expect(postStreamMock).not.toHaveBeenCalled();
    });

    it("retryMessage re-sends a failed question once", async () => {
      postStreamMock.mockRejectedValueOnce(new Error("offline"));
      await useChatStore.getState().sendMessage("Again?", "chat-a");
      const failedId = useChatStore.getState().messages[0].id;

      postStreamMock.mockImplementation(
        streamEvents({
          type: "done",
          message: { ...messageA, id: "msg-ok", content: "Yes" },
        }),
      );
      await useChatStore.getState().retryMessage(failedId);

      const messages = useChatStore.getState().messages;
      expect(messages.map((m) => [m.author, m.content, m.status])).toEqual([
        ["user", "Again?", undefined],
        ["assistant", "Yes", undefined],
      ]);
    });
  });

  describe("document status", () => {
    it.each([
      ["processing", "processing"],
      ["failed", "failed"],
      ["ready", "ready"],
      // Documents indexed before status tracking never left "pending".
      ["pending", "ready"],
      [undefined, "ready"],
    ])("maps %s to %s", (documentStatus, expected) => {
      const chat = documentStatus
        ? { ...chatA, document: { status: documentStatus } }
        : chatA;
      expect(toProcessingStatus(chat)).toBe(expected);
    });

    it("selecting a chat whose document failed shows failed", () => {
      useChatStore
        .getState()
        .setCurrentChat({ ...chatB, document: { status: "failed" } });
      expect(useChatStore.getState().fileProcessingStatus).toBe("failed");
    });

    it("refreshDocumentStatus updates the list and the open chat", async () => {
      useChatStore.setState({ chats: [chatA, chatB], currentChat: chatA });
      internalApiMock.get.mockResolvedValueOnce({
        data: { ...chatA, document: { status: "ready" } },
      });
      useChatStore.setState({ fileProcessingStatus: "processing" });

      await useChatStore.getState().refreshDocumentStatus("chat-a");

      const state = useChatStore.getState();
      expect(state.fileProcessingStatus).toBe("ready");
      expect(state.chats[0].document).toEqual({ status: "ready" });
    });

    it("refreshDocumentStatus doesn't override a live run's result", async () => {
      useChatStore.setState({
        chats: [chatA],
        currentChat: chatA,
        trigger: { id: "run-1", publicAccessToken: "pat" },
        fileProcessingStatus: "failed",
      });
      internalApiMock.get.mockResolvedValueOnce({
        data: { ...chatA, document: { status: "processing" } },
      });

      await useChatStore.getState().refreshDocumentStatus("chat-a");

      expect(useChatStore.getState().fileProcessingStatus).toBe("failed");
    });
  });

  describe("openChat", () => {
    it("uses a chat already in the list and loads its messages", async () => {
      useChatStore.setState({ chats: [chatA, chatB] });
      internalApiMock.get.mockResolvedValueOnce({ data: [messageA] });

      await useChatStore.getState().openChat("chat-b");

      expect(internalApiMock.get).toHaveBeenCalledTimes(1);
      expect(internalApiMock.get).toHaveBeenCalledWith("/v1/chats/chat-b/messages");
      expect(useChatStore.getState().currentChat).toEqual(chatB);
    });

    it("fetches a chat that isn't in the list (deep link)", async () => {
      internalApiMock.get
        .mockResolvedValueOnce({ data: chatB })
        .mockResolvedValueOnce({ data: [] });

      await useChatStore.getState().openChat("chat-b");

      expect(internalApiMock.get).toHaveBeenNthCalledWith(1, "/v1/chats/chat-b");
      expect(useChatStore.getState().currentChat).toEqual(chatB);
      expect(useChatStore.getState().chatNotFound).toBe(false);
    });

    it("flags chatNotFound when the chat can't be loaded", async () => {
      useChatStore.setState({ currentChat: chatA, messages: [messageA] });
      internalApiMock.get.mockRejectedValueOnce(new Error("404"));

      await useChatStore.getState().openChat("missing");

      const state = useChatStore.getState();
      expect(state.chatNotFound).toBe(true);
      expect(state.currentChat).toBeNull();
      expect(state.messages).toEqual([]);
    });

    it("keeps upload state when reopening the chat that was just created", async () => {
      const trigger = { id: "run-1", publicAccessToken: "pat" };
      useChatStore.setState({
        currentChat: chatA,
        trigger,
        fileProcessingStatus: "processing",
      });
      internalApiMock.get.mockResolvedValueOnce({ data: [] });

      await useChatStore.getState().openChat("chat-a");

      expect(useChatStore.getState().trigger).toEqual(trigger);
      expect(useChatStore.getState().fileProcessingStatus).toBe("processing");
    });
  });

  describe("deleteChat", () => {
    it("removes the chat from the list", async () => {
      internalApiMock.delete.mockResolvedValueOnce({});
      useChatStore.setState({ chats: [chatA, chatB], currentChat: chatB });

      await useChatStore.getState().deleteChat("chat-a");

      expect(internalApiMock.delete).toHaveBeenCalledWith("/v1/chats/chat-a");
      expect(useChatStore.getState().chats).toEqual([chatB]);
      expect(useChatStore.getState().currentChat).toEqual(chatB);
      expect(useChatStore.getState().deletingChatId).toBeNull();
    });

    it("resets currentChat/messages/file state when deleting the active chat", async () => {
      internalApiMock.delete.mockResolvedValueOnce({});
      useChatStore.setState({
        chats: [chatA, chatB],
        currentChat: chatA,
        messages: [messageA],
        currentFile: "file-a",
        fileProcessingStatus: "ready",
      });

      await useChatStore.getState().deleteChat("chat-a");

      const state = useChatStore.getState();
      expect(state.chats).toEqual([chatB]);
      expect(state.currentChat).toBeNull();
      expect(state.currentFile).toBeNull();
      expect(state.messages).toEqual([]);
    });

    it("falls back to null currentChat when the deleted chat was the last one", async () => {
      internalApiMock.delete.mockResolvedValueOnce({});
      useChatStore.setState({ chats: [chatA], currentChat: chatA });

      await useChatStore.getState().deleteChat("chat-a");

      const state = useChatStore.getState();
      expect(state.chats).toEqual([]);
      expect(state.currentChat).toBeNull();
      expect(state.fileProcessingStatus).toBe("idle");
    });

    it("sets an error and clears deletingChatId on failure", async () => {
      internalApiMock.delete.mockRejectedValueOnce(new Error("delete failed"));
      useChatStore.setState({ chats: [chatA] });

      await useChatStore.getState().deleteChat("chat-a");

      expect(useChatStore.getState().chats).toEqual([chatA]);
      expect(useChatStore.getState().error).toBe("delete failed");
      expect(useChatStore.getState().deletingChatId).toBeNull();
    });
  });
});
