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
    isMessagesLoading,
    isSendingMessage,
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
    <div className="flex min-w-0 flex-1 flex-col bg-neutral-50">
      {currentChat && trigger ? (
        <>
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/bot.jpg"
                alt="Logo"
                className="h-9 w-9 rounded-md border border-neutral-200 object-cover"
                width={36}
                height={36}
              />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-950">
                  {ASSISTANT_NAME}
                </p>
                <p className="truncate text-xs leading-5 text-neutral-500">
                  {currentChat?.title || "No chat selected"}
                </p>
              </div>
            </div>
            {trigger?.id && (
              <div className="shrink-0">
                <FileLoaded />
              </div>
            )}
          </header>
          <section className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
            {isMessagesLoading ? (
              <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-end gap-4 py-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    className="h-24 animate-pulse rounded-md border border-neutral-200 bg-white"
                    key={index}
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <NoMessage />
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            {isSendingMessage && (
              <div className="mx-auto flex w-full max-w-3xl gap-3 px-1 py-2">
                <Image
                  alt=""
                  className="h-8 w-8 rounded-md border border-neutral-200 object-cover"
                  priority
                  width={32}
                  height={32}
                  src="/bot.jpg"
                />
                <div className="rounded-md border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                  <div className="mb-2 text-xs font-semibold text-neutral-600">
                    Selene is thinking
                  </div>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef}></div>
          </section>
          <footer className="border-t border-neutral-200 bg-white px-4 py-4 sm:px-6">
            <MessageForm />
          </footer>
        </>
      ) : (
        <NoChatMessage />
      )}
    </div>
  );
}
