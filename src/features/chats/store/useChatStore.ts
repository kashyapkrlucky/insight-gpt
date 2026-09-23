import { create } from "zustand";
import { Chat, Message } from "../types";
import axios from "@/shared/lib/http/internalApi";
import { postStream } from "@/shared/lib/http/streamRequest";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/shared/lib/errors";
import { storageClientService } from "@/infra/storage/services/StorageClientService";

export type FileProcessingStatus = "idle" | "processing" | "ready" | "failed";
export type UploadStage = "idle" | "uploading" | "registering";

type TriggerRun = { id: string | null; publicAccessToken: string | null };

const NO_RUN: TriggerRun = { id: null, publicAccessToken: null };

const tempId = () => `temp-${crypto.randomUUID()}`;

/**
 * Maps a document's stored status to the UI state. "pending" is treated as
 * ready: documents indexed before status tracking existed never left it.
 */
export const toProcessingStatus = (chat: Chat | null): FileProcessingStatus => {
  if (!chat) return "idle";
  switch (chat.document?.status) {
    case "processing":
      return "processing";
    case "failed":
      return "failed";
    default:
      return "ready";
  }
};

interface ChatStore {
  error: string | null;

  chats: Chat[];
  isChatsLoading: boolean;
  hasLoadedChats: boolean;
  getChats: () => Promise<Chat[]>;
  addChat: (chat: Chat) => void;

  currentChat: Chat | null;
  isChatLoading: boolean;
  chatNotFound: boolean;
  setCurrentChat: (chat: Chat | null) => void;
  openChat: (chatId: string) => Promise<void>;

  isFileUploading: boolean;
  uploadStage: UploadStage;
  uploadDocument: (file: File) => Promise<Chat | null>;
  currentFile: string | null;
  trigger: TriggerRun;
  fileProcessingStatus: FileProcessingStatus;
  /** Why indexing failed, when known (e.g. a PDF with no text). */
  fileProcessingError: string | null;
  setFileProcessingStatus: (
    status: FileProcessingStatus,
    error?: string | null,
  ) => void;
  /** Re-reads the current chat's document status from the API. */
  refreshDocumentStatus: (chatId: string) => Promise<void>;

  messages: Message[];
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  getMessages: (chatId: string) => Promise<Message[]>;
  addMessage: (message: Message) => void;
  sendMessage: (question: string, chatId: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;

  deletingChatId: string | null;
  deleteChat: (chatId: string) => Promise<boolean>;
}

export const useChatStore = create<ChatStore>((set, get) => {
  const updateMessage = (id: string, patch: Partial<Message>) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    }));

  const removeMessage = (id: string) =>
    set((state) => ({
      messages: state.messages.filter((message) => message.id !== id),
    }));

  return {
    error: null,

    chats: [],
    isChatsLoading: false,
    hasLoadedChats: false,
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
        set({ isChatsLoading: false, hasLoadedChats: true });
      }
    },
    addChat: (chat: Chat) =>
      set((state) => ({
        chats: [chat, ...state.chats.filter((item) => item.id !== chat.id)],
      })),

    currentChat: null,
    isChatLoading: false,
    chatNotFound: false,
    setCurrentChat: (chat: Chat | null) =>
      set((state) => {
        const isSameChat = state.currentChat?.id === chat?.id;

        return {
          currentChat: chat,
          chatNotFound: false,
          messages: isSameChat ? state.messages : [],
          currentFile: isSameChat ? state.currentFile : null,
          fileProcessingStatus: isSameChat
            ? state.fileProcessingStatus
            : toProcessingStatus(chat),
          fileProcessingError: isSameChat ? state.fileProcessingError : null,
          trigger: isSameChat ? state.trigger : NO_RUN,
        };
      }),
    openChat: async (chatId: string) => {
      const { currentChat, chats } = get();
      if (currentChat?.id === chatId) {
        // Already open (e.g. right after upload); refresh messages only if
        // none are loaded yet.
        if (get().messages.length === 0) await get().getMessages(chatId);
        return;
      }

      let chat = chats.find((item) => item.id === chatId) ?? null;
      if (!chat) {
        try {
          set({ isChatLoading: true, chatNotFound: false });
          const { data } = await axios.get(`/v1/chats/${chatId}`);
          chat = data as Chat;
        } catch {
          set({
            isChatLoading: false,
            chatNotFound: true,
            currentChat: null,
            messages: [],
          });
          return;
        }
      }

      get().setCurrentChat(chat);
      set({ isChatLoading: false });
      await get().getMessages(chatId);
    },

    isFileUploading: false,
    uploadStage: "idle",
    uploadDocument: async (file: File) => {
      try {
        set({ isFileUploading: true, uploadStage: "uploading", error: null });
        storageClientService.validateFile(file);

        // 1. Ask the server for a signed upload URL inside this user's folder.
        const {
          data: { path, token },
        } = await axios.post("/v1/documents/upload-url", {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        // 2. Upload the file straight to storage.
        const upload = await storageClientService.uploadToSignedUrl(
          path,
          token,
          file,
        );
        if (!upload.success) {
          throw new Error(upload.error || "Failed to upload file.");
        }

        // 3. Register the document and start indexing.
        set({ uploadStage: "registering" });
        const {
          data: { document, trigger, chat },
        } = await axios.post("/v1/documents", { path, name: file.name });
        set({
          currentFile: document.id,
          currentChat: chat,
          chatNotFound: false,
          messages: [],
          trigger: {
            id: trigger.id,
            publicAccessToken: trigger.publicAccessToken,
          },
          fileProcessingStatus: "processing",
          fileProcessingError: null,
        });
        get().addChat(chat);
        return chat as Chat;
      } catch (error) {
        const message = getErrorMessage(error, "Failed to upload file.");
        set({ error: message });
        toast.error(message);
        return null;
      } finally {
        set({ isFileUploading: false, uploadStage: "idle" });
      }
    },
    currentFile: null,
    trigger: NO_RUN,
    fileProcessingStatus: "idle",
    fileProcessingError: null,
    setFileProcessingStatus: (fileProcessingStatus, error = null) =>
      set({ fileProcessingStatus, fileProcessingError: error }),
    refreshDocumentStatus: async (chatId: string) => {
      try {
        const { data } = await axios.get(`/v1/chats/${chatId}`);
        const chat = data as Chat;
        set((state) => ({
          chats: state.chats.map((item) => (item.id === chatId ? chat : item)),
          ...(state.currentChat?.id === chatId
            ? {
                currentChat: chat,
                // A live run is the source of truth: the DB can lag behind
                // it (onFailure writes "failed" after the run reports it).
                ...(state.trigger.id
                  ? {}
                  : { fileProcessingStatus: toProcessingStatus(chat) }),
              }
            : {}),
        }));
      } catch {
        // Transient; the next poll will try again.
      }
    },

    messages: [],
    isMessagesLoading: false,
    isSendingMessage: false,
    getMessages: async (chatId: string) => {
      try {
        set({ isMessagesLoading: true, error: null });
        const { data } = await axios.get(`/v1/chats/${chatId}/messages`);
        // Ignore the response if the user switched chats meanwhile.
        if (get().currentChat && get().currentChat?.id !== chatId) return data;
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
    addMessage: (message: Message) =>
      set((state) => ({ messages: [...state.messages, message] })),
    sendMessage: async (question: string, chatId: string) => {
      if (get().isSendingMessage) return;

      const userMessageId = tempId();
      const answerId = tempId();
      const now = new Date();

      set({ isSendingMessage: true, error: null });
      get().addMessage({
        id: userMessageId,
        chatId,
        author: "user",
        content: question,
        createdAt: now,
        status: "sending",
      });
      get().addMessage({
        id: answerId,
        chatId,
        author: "assistant",
        content: "",
        createdAt: now,
        status: "streaming",
      });

      try {
        let streamError: string | null = null;
        let completed = false;
        let answer = "";

        await postStream<Message>(
          "/v1/search",
          { question, chatId },
          {
            onEvent: (event) => {
              if (event.type === "delta") {
                answer += event.text;
                updateMessage(answerId, { content: answer });
              } else if (event.type === "done") {
                updateMessage(userMessageId, { status: undefined });
                updateMessage(answerId, { ...event.message, status: undefined });
                completed = true;
              } else {
                streamError = event.error;
              }
            },
          },
        );

        if (streamError || !completed) {
          throw new Error(streamError ?? "The answer was interrupted.");
        }
      } catch (error) {
        const message = getErrorMessage(error, "Failed to send message.");
        removeMessage(answerId);
        updateMessage(userMessageId, { status: "failed" });
        set({ error: message });
        toast.error(message);
      } finally {
        set({ isSendingMessage: false });
      }
    },
    retryMessage: async (messageId: string) => {
      const failed = get().messages.find(
        (message) => message.id === messageId && message.status === "failed",
      );
      if (!failed) return;
      removeMessage(messageId);
      await get().sendMessage(failed.content, failed.chatId);
    },

    deletingChatId: null,
    deleteChat: async (chatId: string) => {
      try {
        set({ deletingChatId: chatId, error: null });
        await axios.delete(`/v1/chats/${chatId}`);
        const wasCurrent = get().currentChat?.id === chatId;
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          ...(wasCurrent
            ? {
                currentChat: null,
                currentFile: null,
                fileProcessingStatus: "idle" as const,
                fileProcessingError: null,
                messages: [],
                trigger: NO_RUN,
              }
            : {}),
        }));
        toast.success("Chat deleted.");
        return true;
      } catch (error) {
        const message = getErrorMessage(error, "Failed to delete chat.");
        set({ error: message });
        toast.error(message);
        return false;
      } finally {
        set({ deletingChatId: null });
      }
    },
  };
});
