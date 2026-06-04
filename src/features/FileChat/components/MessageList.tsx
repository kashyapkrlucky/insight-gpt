import { ASSISTANT_NAME } from "@/shared/constants";
import { ChatMessage } from "@/shared/types";
import Image from "next/image";

interface MessageListProps {
  messages: ChatMessage[];
  isSending: boolean;
}

export function MessageList({ messages, isSending }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="mx-auto grid min-h-full w-full max-w-3xl place-items-center px-5 py-16 text-center">
        <div className="max-w-xl">
          <div className="flex justify-center">
            <Image
              alt=""
              className="object-cover rounded-full border-2 border-neutral-200"
              priority
              width={148}
              height={148}
              src="/bot.jpg"
            />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            What would you like to understand?
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {ASSISTANT_NAME} can inspect PDFs and images, then answer with the
            context still attached.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div>
      {messages.map((message) => (
        <article
          className={`mb-7 flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          key={message.id}
        >
          <div
            className={`max-w-[min(680px,88%)] flex flex-row items-start gap-3 text-sm leading-6 bg-white p-4 rounded-lg shadow-sm ${
              message.role === "user"
                ? "bg-neutral-100 text-neutral-950"
                : "text-neutral-900"
            }`}
          >
            {message.role === "assistant" && (
              <Image
                alt=""
                className="object-cover rounded-full border-2 border-neutral-200"
                priority
                width={32}
                height={32}
                src="/bot.jpg"
              />
            )}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-neutral-500">
                {message.role === "user" ? "You" : ASSISTANT_NAME}
              </div>
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>
        </article>
      ))}

      {isSending ? (
        <article className="flex gap-3">
          <Image
            alt=""
            className="object-cover rounded-full border-2 border-neutral-200"
            priority
            width={32}
            height={32}
            src="/bot.jpg"
          />
          <div className="text-sm leading-6 text-neutral-500">
            {ASSISTANT_NAME} is reading...
          </div>
        </article>
      ) : null}
    </div>
  );
}
