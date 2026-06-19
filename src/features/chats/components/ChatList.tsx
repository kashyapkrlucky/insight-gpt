import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

export function ChatList() {
  const { chats, getChats, currentChat, setCurrentChat } = useChatStore();
  useEffect(() => {
    getChats();
  }, [getChats]);

  if (chats.length === 0) {
    return <div className="text-center text-xs text-neutral-500">No chats found</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      {chats.map((chat) => (
        <div
          className={
            (currentChat?.id === chat.id ? "bg-blue-50" : "") +
            " truncate rounded-lg px-3 py-2.5 text-left text-xs border border-neutral-200 hover:bg-blue-100 disabled:opacity-50"
          }
          key={chat.id}
          onClick={() => setCurrentChat(chat)}
        >
          {chat.title}
        </div>
      ))}
    </div>
  );
}
