import { create } from "zustand";
import { Chat, DocumentInput, Message } from "../types";
import axios from "@/shared/lib/http/internalApi";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/shared/lib/errors";

export type FileProcessingStatus = "idle" | "processing" | "ready" | "failed";

interface ChatStore {
  error: string | null;
  chats: Chat[];
  isChatsLoading: boolean;
  isFileUploading: boolean;
  setFileUploading: (isFileUploading: boolean) => void;
  uploadFile: (formData: FormData) => Promise<boolean>;
  createDocument: (payload: DocumentInput) => Promise<boolean>;
  currentFile: string | null;
  trigger: { id: string | null; publicAccessToken: string | null };
  fileProcessingStatus: FileProcessingStatus;
  setFileProcessingStatus: (status: FileProcessingStatus) => void;
  getChats: () => Promise<Chat[]>;
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  deletingChatId: string | null;
  messages: Message[];
  getMessages: (chatId: string) => Promise<Message[]>;
  sendMessage: (question: string, chatId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  addChat: (chat: Chat) => void;
  deleteChat: (chatId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isFileUploading: false,
  error: null,
  chats: [],
  isChatsLoading: false,
  messages: [],
  isMessagesLoading: false,
  isSendingMessage: false,
  deletingChatId: null,
  currentChat: null,
  setCurrentChat: (chat: Chat | null) =>
    set((state) => {
      const isSameChat = state.currentChat?.id === chat?.id;

      return {
        currentChat: chat,
        messages: isSameChat ? state.messages : [],
        currentFile: isSameChat ? state.currentFile : null,
        fileProcessingStatus: isSameChat
          ? state.fileProcessingStatus
          : chat
            ? "ready"
            : "idle",
        trigger: isSameChat
          ? state.trigger
          : { id: null, publicAccessToken: null },
      };
    }),
  addChat: (chat: Chat) =>
    set((state) => ({
      chats: [chat, ...state.chats.filter((item) => item.id !== chat.id)],
    })),
  currentFile: null,
  trigger: { id: null, publicAccessToken: null },
  fileProcessingStatus: "idle",
  setFileProcessingStatus: (fileProcessingStatus: FileProcessingStatus) =>
    set({ fileProcessingStatus }),
  setFileUploading: (isFileUploading: boolean) => set({ isFileUploading }),
  uploadFile: async (formData: FormData) => {
    try {
      set({ error: null });
      const {
        data: { data, trigger, chat },
      } = await axios.post("/v1/documents", formData);
      set({
        isFileUploading: false,
        currentFile: data.id,
        currentChat: chat,
        messages: [],
        trigger: {
          id: trigger.id,
          publicAccessToken: trigger.publicAccessToken,
        },
        fileProcessingStatus: "processing",
      });
      get().addChat(chat);
      toast.success("File uploaded.");
      return true;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to upload file.");
      set({
        error: message,
      });
      toast.error(message);
      return false;
    } finally {
      set({ isFileUploading: false });
    }
  },
  createDocument: async (payload: DocumentInput) => {
    try {
      set({ isFileUploading: true, error: null });
      const {
        data: { data, trigger, chat },
      } = await axios.post("/v1/documents", payload);
      set({
        currentFile: data.id,
        currentChat: chat,
        messages: [],
        trigger: {
          id: trigger.id,
          publicAccessToken: trigger.publicAccessToken,
        },
        fileProcessingStatus: "processing",
      });
      get().addChat(chat);
      toast.success("File uploaded.");
      return true;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to upload file.");
      set({ error: message });
      toast.error(message);
      return false;
    } finally {
      set({ isFileUploading: false });
    }
  },
  getChats: async () => {
    try {
      set({ isChatsLoading: true, error: null });
      const { data } = await axios.get("/v1/chats");
      set({ chats: data });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch chats.");
      set({ error: message });
      toast.error(message, { id: "fetch-chats-error" });
      return [];
    } finally {
      set({ isChatsLoading: false });
    }
  },
  getMessages: async (chatId: string) => {
    try {
      set({ isMessagesLoading: true, error: null });
      const { data } = await axios.get(`/v1/chats/${chatId}/messages`);
      set({ messages: data });
      return data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to fetch messages.");
      set({ error: message });
      toast.error(message, { id: `fetch-messages-${chatId}` });
      return [];
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (question: string, chatId: string) => {
    try {
      set({ isSendingMessage: true, error: null });
      get().addMessage({
        id: crypto.randomUUID(),
        chatId,
        author: "user",
        content: question,
        createdAt: new Date(),
      });
      const { data } = await axios.post("/v1/search", { question, chatId });
      get().addMessage(data);
    } catch (error) {
      const message = getErrorMessage(error, "Failed to send message.");
      set({
        error: message,
      });
      toast.error(message);
    } finally {
      set({ isSendingMessage: false });
    }
  },
  addMessage: (message: Message) =>
    set((state) => ({ ...state, messages: [...state.messages, message] })),
  deleteChat: async (chatId: string) => {
    try {
      set({ deletingChatId: chatId, error: null });
      await axios.delete(`/v1/chats/${chatId}`);
      const nextChats = get().chats.filter((chat) => chat.id !== chatId);
      const shouldResetCurrentChat = get().currentChat?.id === chatId;
      set({
        chats: nextChats,
        currentChat: shouldResetCurrentChat
          ? nextChats[0] || null
          : get().currentChat,
        currentFile: shouldResetCurrentChat ? null : get().currentFile,
        fileProcessingStatus: shouldResetCurrentChat
          ? nextChats.length > 0
            ? "ready"
            : "idle"
          : get().fileProcessingStatus,
        messages: shouldResetCurrentChat ? [] : get().messages,
        trigger: shouldResetCurrentChat
          ? { id: null, publicAccessToken: null }
          : get().trigger,
      });
      toast.success("Chat deleted.");
    } catch (error) {
      const message = getErrorMessage(error, "Failed to delete chat.");
      set({ error: message });
      toast.error(message);
    } finally {
      set({ deletingChatId: null });
    }
  },
}));
