import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Trash2Icon } from "lucide-react";

export function ChatList() {
  const { chats, getChats, currentChat, setCurrentChat, deleteChat } = useChatStore();
  
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
          className={`relative flex disabled:opacity-50 group border ${currentChat?.id === chat.id ? "border-gray-500" : "border-neutral-200"} rounded-lg`}
          key={chat.id}
          onClick={() => setCurrentChat(chat)}
        >
          <div className="w-[80%] truncate px-3 py-2.5 text-left text-sm ">
            {chat.title}
          </div>

          <div className="absolute right-2 top-2 flex hidden group-hover:flex">
            <button className="p-1 rounded-sm bg-red-100" onClick={(e) => {
              e.stopPropagation();
              deleteChat(chat.id);
            }}>
              <Trash2Icon className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
