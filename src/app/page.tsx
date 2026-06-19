"use client";
import { ASSISTANT_NAME } from "@/shared/constants";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import PageLoader from "@/shared/ui/PageLoader";
import { getCodeFromURL } from "@/features/auth/utils";
import useAuthStore from "@/features/auth/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/features/chats/store/useChatStore";
import FileLoaded from "@/features/home/components/FileLoaded";
import NoMessage from "@/features/home/components/NoMessage";
import ChatMessage from "@/features/home/components/ChatMessage";
import InlineLoader from "@/shared/ui/InlineLoader";
import MessageForm from "@/features/home/components/MessageForm";
import NoChatMessage from "@/features/home/components/NoChatMessage";
import LeftSideBar from "@/features/home/components/LeftSideBar";

export default function Home() {
  const {
    currentChat,
    messages,
    getMessages,
    trigger,
    loading: chatLoading,
    inlineLoading
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { getUserData, isAuthenticated, loading } = useAuthStore();
  const [isOAuthChecked, setIsOAuthChecked] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = getCodeFromURL();
      if (code) {
        try {
          await getUserData(code);
          setIsOAuthChecked(true);
        } catch (error) {
          console.error("OAuth callback failed:", error);
        }
      } else {
        setIsOAuthChecked(true);
      }
    };

    handleOAuthCallback();
  }, [getUserData]);

  useEffect(() => {
    if (currentChat && isAuthenticated) {
      getMessages(currentChat.id);
    }
  }, [currentChat, getMessages, isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOAuthChecked && !isAuthenticated && !loading) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, isOAuthChecked, router]);

  if ((loading || !isOAuthChecked) && chatLoading) {
    return <PageLoader />;
  }

  return (
    <main className="flex flex-row h-screen overflow-hidden bg-gray-50 text-gray-900">
      <LeftSideBar />
      <main className="flex-1 flex flex-col  bg-slate-100">
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
              {inlineLoading && <InlineLoader />}
              <div ref={bottomRef}></div>
            </section>
            <footer className="p-4 bg-white border-t border-neutral-200">
              <MessageForm />
            </footer>
          </>
        ) : (
          <NoChatMessage />
        )}
      </main>
    </main>
  );
}
