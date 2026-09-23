"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FileTextIcon, SearchXIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { displayTitle } from "../utils/groupChats";
import { TopBar } from "./TopBar";
import { FileStatus } from "./FileStatus";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { EmptyChat } from "./EmptyChat";

export default function ChatView({ chatId }: { chatId: string }) {
  const {
    openChat,
    currentChat,
    chatNotFound,
    messages,
    isMessagesLoading,
    fileProcessingStatus,
    fileProcessingError,
    isSendingMessage,
    sendMessage,
    retryMessage,
  } = useChatStore();

  useEffect(() => {
    openChat(chatId);
  }, [chatId, openChat]);

  const chat = currentChat?.id === chatId ? currentChat : null;

  if (chatNotFound) {
    return (
      <>
        <TopBar />
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <SearchXIcon className="mx-auto size-8 text-subtle" />
            <h2 className="mt-3 text-lg font-semibold text-fg">Chat not found</h2>
            <p className="mt-1 text-sm text-muted">
              It may have been deleted, or it belongs to another account.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
            >
              Start a new chat
            </Link>
          </div>
        </div>
      </>
    );
  }

  const isLoading = !chat || (isMessagesLoading && messages.length === 0);
  const isReady = fileProcessingStatus === "ready";
  const send = (text: string) => sendMessage(text, chatId);

  return (
    <>
      <TopBar>
        {chat ? (
          <>
            <FileTextIcon className="hidden size-4 shrink-0 text-muted sm:block" />
            <h1 className="min-w-0 truncate text-sm font-medium text-fg" title={chat.title}>
              {displayTitle(chat.title)}
            </h1>
            <FileStatus />
          </>
        ) : (
          <div className="h-4 w-40 animate-pulse rounded bg-surface-2" />
        )}
      </TopBar>

      {isLoading ? (
        <div className="flex-1 overflow-hidden" aria-label="Loading conversation">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
            {[0, 1].map((index) => (
              <div key={index} className="space-y-6">
                <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-surface-2" />
                <div className="flex gap-4">
                  <div className="size-8 shrink-0 animate-pulse rounded-full bg-surface-2" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 w-11/12 animate-pulse rounded bg-surface-2" />
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-surface-2" />
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-surface-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : messages.length === 0 ? (
        <EmptyChat
          title={chat.title}
          status={fileProcessingStatus}
          error={fileProcessingError}
          onPrompt={send}
        />
      ) : (
        <MessageList messages={messages} onRetry={retryMessage} />
      )}

      <Composer
        onSend={send}
        disabled={!chat || !isReady}
        isBusy={isSendingMessage}
        placeholder={
          fileProcessingStatus === "failed"
            ? "This document couldn't be processed"
            : fileProcessingStatus === "processing"
              ? "Indexing the document. You can ask in a moment…"
              : "Ask a question about this PDF…"
        }
      />
    </>
  );
}
