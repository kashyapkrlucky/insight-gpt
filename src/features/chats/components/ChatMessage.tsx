import { type Message } from "@/features/chats/types";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { formatDateWithTime } from "@/features/auth/utils";

export default function ChatMessage({ message }: { message: Message }) {
  const { user } = useAuthStore();
  return (
    <article
      className={`mb-7 flex gap-3 ${message.author === "user" ? "justify-end" : "justify-start"}`}
      key={message.id}
    >
      <div
        className={`max-w-[min(680px,88%)] flex flex-row gap-3 text-neutral-900`}
      >
        <div className="flex-shrink-0 py-2">
          {message.author === "assistant" ? (
            <Image
              alt=""
              className="object-cover rounded-full border-2 border-neutral-200"
              priority
              width={32}
              height={32}
              src="/bot.jpg"
            />
          ) : (
            <Image
              alt=""
              className="object-cover rounded-full border-2 border-neutral-200"
              priority
              width={32}
              height={32}
              src={user?.avatar || "/circle-user-round.svg"}
            />
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm leading-6 bg-white px-4 py-2.5 rounded-lg shadow-sm">
          <header className={`flex items-center gap-2 `}>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">
                {message.author === "assistant" ? "Selene" : "You"}
              </span>
              <span className="text-xs text-neutral-500">
                {formatDateWithTime(new Date(message.createdAt))}
              </span>
            </div>
          </header>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold text-neutral-900 mb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-bold text-neutral-900 mb-2">
                  {children}
                </h2>
              ),
              p: ({ children }) => (
                <p className="mb-2 text-neutral-900">{children}</p>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
