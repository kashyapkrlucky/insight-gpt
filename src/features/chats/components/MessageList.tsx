"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDownIcon } from "lucide-react";
import type { Message } from "../types";
import ChatMessage from "./ChatMessage";
import { ASSISTANT_NAME } from "@/shared/constants";

const NEAR_BOTTOM_PX = 120;

export function MessageList({
  messages,
  onRetry,
  footer,
}: {
  messages: Message[];
  onRetry: (messageId: string) => void;
  footer?: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const lastMessage = messages.at(-1);
  const isStreaming = lastMessage?.status === "streaming";

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < NEAR_BOTTOM_PX;
    setShowJump(distance > NEAR_BOTTOM_PX * 2);
  };

  // A new question always scrolls into view.
  useEffect(() => {
    if (lastMessage?.author === "user" || lastMessage?.status === "streaming") {
      stickToBottom.current = true;
    }
  }, [lastMessage?.id, lastMessage?.author, lastMessage?.status]);

  // Follow the conversation (and streaming text) while pinned to the bottom.
  useLayoutEffect(() => {
    if (stickToBottom.current) scrollToBottom();
  }, [messages]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto overscroll-contain"
      >
        <div
          role="log"
          aria-label="Conversation"
          className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-6 sm:px-6 sm:py-8"
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} onRetry={onRetry} />
          ))}
          {footer}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {isStreaming ? `${ASSISTANT_NAME} is writing an answer` : ""}
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => {
            stickToBottom.current = true;
            scrollToBottom("smooth");
          }}
          className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 animate-fade-in items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-fg shadow-float hover:bg-surface-2"
        >
          <ArrowDownIcon className="size-3.5" />
          Jump to latest
        </button>
      )}
    </div>
  );
}
