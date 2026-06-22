import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { MessageSquareTextIcon, Trash2Icon } from "lucide-react";
import InlineLoader from "@/shared/ui/InlineLoader";

export function ChatList() {
  const {
    chats,
    getChats,
    currentChat,
    setCurrentChat,
    deleteChat,
    deletingChatId,
    isChatsLoading,
  } = useChatStore();

  useEffect(() => {
    getChats();
  }, [getChats]);

  const selectChat = (chat: (typeof chats)[number]) => {
    if (deletingChatId === chat.id) return;
    setCurrentChat(chat);
  };

  if (isChatsLoading && chats.length === 0) {
    return (
      <div className="flex flex-col gap-2" aria-label="Loading chats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-12 animate-pulse rounded-md border border-neutral-200 bg-neutral-100"
            key={index}
          />
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-xs leading-5 text-neutral-500">
        No chats yet. Upload a PDF to create your first workspace.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {chats.map((chat) => (
        <div
          aria-disabled={deletingChatId === chat.id}
          role="button"
          tabIndex={0}
          className={`group relative flex items-center gap-2 rounded-md border px-2.5 py-2.5 text-left transition ${currentChat?.id === chat.id ? "border-neutral-950 bg-neutral-950 text-white shadow-sm" : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50"} ${deletingChatId === chat.id ? "cursor-wait opacity-60" : "cursor-pointer"}`}
          key={chat.id}
          onClick={() => selectChat(chat)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectChat(chat);
            }
          }}
        >
          <MessageSquareTextIcon
            className={`h-4 w-4 shrink-0 ${currentChat?.id === chat.id ? "text-white" : "text-neutral-400"}`}
          />
          <div className="min-w-0 flex-1 truncate text-sm font-medium">
            {chat.title || "Untitled chat"}
          </div>

          <div className="flex h-7 w-7 shrink-0 items-center justify-center opacity-0 transition group-hover:opacity-100">
            {deletingChatId === chat.id ? (
              <InlineLoader />
            ) : (
              <button
                aria-label="Delete chat"
                className={`rounded-md p-1.5 transition ${currentChat?.id === chat.id ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-neutral-400 hover:bg-red-50 hover:text-red-600"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                <Trash2Icon className="h-4 w-4 text-red-500" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
