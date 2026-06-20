import { create } from "zustand";
import { Chat, Message } from "../types";
import axios from "@/shared/lib/http/internalApi";

interface ChatStore {
  loading: boolean;
  inlineLoading: boolean;
  error: string | null;
  chats: Chat[];
  uploadFile: (formData: FormData) => Promise<void>;
  currentFile: string | null;
  trigger: { id: string | null; publicAccessToken: string | null };
  getChats: () => Promise<Chat[]>;
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat) => void;
  messages: Message[];
  getMessages: (chatId: string) => Promise<Message[]>;
  sendMessage: (question: string, chatId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  addChat: (chat: Chat) => void;
  deleteChat: (chatId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  loading: false,
  inlineLoading: false,
  error: null,
  chats: [],
  messages: [],
  currentChat: null,
  setCurrentChat: (chat: Chat) => set({ currentChat: chat }),
  addChat: (chat: Chat) => set({ chats: [chat, ...get().chats] }),
  currentFile: null,
  trigger: { id: null, publicAccessToken: null },
  uploadFile: async (formData: FormData) => {
    try {
      set({ loading: true, error: null });
      const {
        data: { data, trigger, chat },
      } = await axios.post("/v1/documents", formData);
      set({
        loading: false,
        currentFile: data.id,
        currentChat: chat,
        trigger: {
          id: trigger.id,
          publicAccessToken: trigger.publicAccessToken,
        },
      });
      get().addChat(chat);
    } catch {
      set({
        error: "Failed to upload file",
      });
    } finally {
      set({ loading: false });
    }
  },
  getChats: async () => {
    try {
      set({ loading: true });
      const { data } = await axios.get("/v1/chats");
      set({ chats: data });
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      set({ loading: false });
    }
  },
  getMessages: async (chatId: string) => {
    try {
      set({ loading: true });
      const { data } = await axios.get(`/v1/chats/${chatId}/messages`);
      set({ messages: data });
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      set({ loading: false });
    }
  },
  sendMessage: async (question: string, chatId: string) => {
    try {
      set({ inlineLoading: true, error: null });
      get().addMessage({
        id: crypto.randomUUID(),
        chatId,
        author: "user",
        content: question,
        createdAt: new Date(),
      });
      const { data } = await axios.post("/v1/search", { question, chatId });
      set({ inlineLoading: false });
      get().addMessage(data);
    } catch {
      set({
        error: "Failed to search",
      });
    } finally {
      set({ inlineLoading: false });
    }
  },
  addMessage: (message: Message) =>
    set((state) => ({ ...state, messages: [...state.messages, message] })),
  deleteChat: async (chatId: string) => {
    try {
      set({ loading: true });
      await axios.delete(`/v1/chats/${chatId}`);
      set({ chats: get().chats.filter((chat) => chat.id !== chatId) });
      set({ currentChat: get().chats[0] || null });
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },
}));
