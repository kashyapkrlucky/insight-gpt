import { beforeEach, describe, expect, it, vi } from "vitest";

const internalApiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/shared/lib/http/internalApi", () => ({
  default: internalApiMock,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { useChatStore } from "./useChatStore";
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
    useChatStore.setState(initialState, true);
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
    it("optimistically adds the user message then appends the response", async () => {
      internalApiMock.post.mockResolvedValueOnce({
        data: { ...messageA, id: "msg-response", author: "assistant" },
      });

      await useChatStore.getState().sendMessage("What is this?", "chat-a");

      expect(internalApiMock.post).toHaveBeenCalledWith("/v1/search", {
        question: "What is this?",
        chatId: "chat-a",
      });
      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0]).toMatchObject({
        author: "user",
        content: "What is this?",
        chatId: "chat-a",
      });
      expect(messages[1]).toMatchObject({ id: "msg-response" });
      expect(useChatStore.getState().isSendingMessage).toBe(false);
    });

    it("keeps the optimistic user message and sets an error on failure", async () => {
      internalApiMock.post.mockRejectedValueOnce(new Error("send failed"));

      await useChatStore.getState().sendMessage("Will fail", "chat-a");

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({ author: "user", content: "Will fail" });
      expect(useChatStore.getState().error).toBe("send failed");
      expect(useChatStore.getState().isSendingMessage).toBe(false);
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
      expect(state.currentChat).toEqual(chatB);
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
