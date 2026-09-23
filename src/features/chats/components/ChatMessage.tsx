"use client";

import { memo } from "react";
import Image from "next/image";
import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import { type Message } from "@/features/chats/types";
import { ASSISTANT_NAME } from "@/shared/constants";
import { cn, formatDateWithTime } from "@/shared/utils";
import { CopyButton } from "@/shared/ui/CopyButton";
import { Markdown } from "./Markdown";
import TypingIndicator from "./TypingIndicator";

type ChatMessageProps = {
  message: Message;
  onRetry?: (messageId: string) => void;
};

function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const createdAt = new Date(message.createdAt);
  const timestamp = formatDateWithTime(createdAt);

  if (message.author === "user") {
    const isFailed = message.status === "failed";
    return (
      <article
        aria-label={`You, ${timestamp}`}
        className="flex animate-slide-up flex-col items-end"
      >
        <div
          title={timestamp}
          className={cn(
            "max-w-[85%] rounded-2xl rounded-br-md bg-bubble px-4 py-2.5 text-[15px] leading-7 whitespace-pre-wrap break-words text-fg sm:max-w-[75%]",
            message.status === "sending" && "opacity-70",
            isFailed && "ring-1 ring-danger/40",
          )}
        >
          {message.content}
        </div>
        {isFailed && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-danger">
            <CircleAlertIcon className="size-3.5" />
            Not sent
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium hover:bg-danger-soft"
              >
                <RotateCcwIcon className="size-3" />
                Retry
              </button>
            )}
          </div>
        )}
      </article>
    );
  }

  const isStreaming = message.status === "streaming";
  const isThinking = isStreaming && !message.content;

  return (
    <article
      aria-label={`${ASSISTANT_NAME}, ${timestamp}`}
      aria-busy={isStreaming || undefined}
      className="group flex animate-slide-up gap-3 sm:gap-4"
    >
      <Image
        alt=""
        src="/bot.jpg"
        width={32}
        height={32}
        className="mt-0.5 size-7 shrink-0 rounded-full object-cover ring-1 ring-border sm:size-8"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-fg">{ASSISTANT_NAME}</span>
          <time
            dateTime={createdAt.toISOString()}
            className="text-xs text-subtle opacity-0 transition-opacity group-hover:opacity-100"
          >
            {timestamp}
          </time>
        </div>

        {isThinking ? (
          <div className="flex items-center gap-2.5 py-1.5 text-sm text-muted">
            <TypingIndicator />
            Reading the document…
          </div>
        ) : (
          <div className="text-[15px] leading-7 break-words text-fg">
            <Markdown content={message.content} />
            {isStreaming && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-full bg-accent"
              />
            )}
          </div>
        )}

        {!isStreaming && message.content && (
          <div className="mt-1 -ml-1.5 flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <CopyButton text={message.content} label="Copy answer" />
          </div>
        )}
      </div>
    </article>
  );
}

export default memo(ChatMessage);
