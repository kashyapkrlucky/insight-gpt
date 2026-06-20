import { ASSISTANT_NAME } from "@/shared/constants";
import Image from "next/image";
import { useChatStore } from "@/features/chats/store/useChatStore";
import FileLoaded from "@/features/chats/components/FileLoaded";
import NoMessage from "@/features/chats/components/NoMessage";
import ChatMessage from "@/features/chats/components/ChatMessage";
import MessageForm from "@/features/chats/components/MessageForm";
import NoChatMessage from "@/features/chats/components/NoChatMessage";
import { useEffect, useRef } from "react";
import useAuthStore from "@/features/auth/store/useAuthStore";
import TypingIndicator from "./TypingIndicator";
export default function ChatContainer() {
  const { isAuthenticated } = useAuthStore();
  const {
    currentChat,
    messages,
    getMessages,
    trigger,
    isMessageLoading,
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (currentChat && isAuthenticated) {
      getMessages(currentChat.id);
    }
  }, [currentChat, getMessages, isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col  bg-slate-100">
      {currentChat && trigger ? (
        <>
          <header className="flex min-h-14 items-center justify-between bg-white border-b border-neutral-200 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Image
                src="/bot.jpg"
                alt="Logo"
                className="h-8 w-8 border border-neutral-200 rounded-full"
                width={32}
                height={32}
              />

              <div>
                <p className="text-sm font-medium text-neutral-950">
                  {ASSISTANT_NAME}
                </p>
                <p className="text-xs text-neutral-500">
                  {currentChat?.title || "No chat selected"}
                </p>
              </div>
            </div>
            {trigger?.id && <FileLoaded />}
          </header>
          <section className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">
            {messages.length === 0 ? (
              <NoMessage />
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            {isMessageLoading && (
              <>
                <div className="flex gap-3 p-4 px-4 py-3">
                  <Image
                    alt=""
                    className="object-cover rounded-full border-2 border-neutral-200"
                    priority
                    width={32}
                    height={32}
                    src="/bot.jpg"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-xs sm:text-sm mb-2 text-zinc-600">
                      Selene is thinking...
                    </div>
                    <TypingIndicator />
                  </div>
                </div>
              </>
            )}
            <div ref={bottomRef}></div>
          </section>
          <footer className="p-4 bg-white border-t border-neutral-200">
            <MessageForm />
          </footer>
        </>
      ) : (
        <NoChatMessage />
      )}
    </div>
  );
}
