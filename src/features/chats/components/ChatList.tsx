import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Trash2Icon } from "lucide-react";
import InlineLoader from "@/shared/ui/InlineLoader";

export function ChatList() {
  const { chats, getChats, currentChat, setCurrentChat, deleteChat, loading } =
    useChatStore();

  useEffect(() => {
    getChats();
  }, [getChats]);

  if (chats.length === 0) {
    return (
      <div className="text-center text-xs text-neutral-500">No chats found</div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {chats.map((chat) => (
        <div
          className={`relative flex disabled:opacity-50 group border ${currentChat?.id === chat.id ? "border-gray-900" : "border-neutral-200"} rounded-lg`}
          key={chat.id}
          onClick={() => setCurrentChat(chat)}
        >
          <div className="w-[90%] truncate px-3 py-2.5 text-left text-sm ">
            {chat.title}
          </div>

          <div className="absolute right-1 top-1 p-1 flex items-center justify-center hidden group-hover:flex">
            {loading ? (
              <div className="p-1">
                <InlineLoader />
              </div>
            ) : (
              <button
                className="p-1 rounded-sm bg-red-100"
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
