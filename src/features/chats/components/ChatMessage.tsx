import { type Message } from "@/features/chats/types";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { formatDateWithTime } from "@/shared/utils";

export default function ChatMessage({ message }: { message: Message }) {
  const { user } = useAuthStore();
  const isUser = message.author === "user";
  const authorName = isUser ? "You" : "Selene";
  const timestamp = formatDateWithTime(new Date(message.createdAt));

  return (
    <article
      aria-label={`${authorName} message sent ${timestamp}`}
      className={`mx-auto flex w-full max-w-3xl gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      key={message.id}
    >
      <div
        className={`flex max-w-[min(720px,92%)] gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      >
        <div className="shrink-0 pt-1">
          {isUser ? (
            user?.avatar ? (
              <Image
                alt=""
                className="h-8 w-8 rounded-md border border-neutral-200 object-cover"
                priority
                width={32}
                height={32}
                src={user.avatar}
              />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-md border border-neutral-200 bg-white text-xs font-semibold text-neutral-700">
                You
              </div>
            )
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700">
              <Image
                alt=""
                className="h-8 w-8 rounded-md border border-neutral-200 object-cover"
                priority
                width={32}
                height={32}
                src="/bot.jpg"
              />
            </div>
          )}
        </div>
        <div
          className={`min-w-0 rounded-md border px-4 py-3 text-sm leading-6 shadow-sm ${isUser ? "max-w-[min(560px,100%)] border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-900"}`}
        >
          <header
            className={`mb-2 flex items-center ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex flex-col ${isUser ? "items-end" : ""}`}>
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${isUser ? "text-white/80" : "text-neutral-500"}`}
              >
                {authorName}
              </span>
              <span
                className={`text-xs ${isUser ? "text-white/50" : "text-neutral-400"}`}
              >
                {timestamp}
              </span>
            </div>
          </header>
          <div
            className={`break-words ${isUser ? "text-white" : "text-neutral-900"}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
              h1: ({ children }) => (
                <h1 className="mb-3 mt-1 text-xl font-semibold leading-7">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 mt-4 text-lg font-semibold leading-7 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 mt-3 text-base font-semibold first:mt-0">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="pl-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote
                  className={`mb-3 border-l-2 pl-3 italic last:mb-0 ${isUser ? "border-white/30 text-white/80" : "border-neutral-300 text-neutral-600"}`}
                >
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  className={`font-medium underline underline-offset-2 ${isUser ? "text-white" : "text-neutral-950"}`}
                  href={href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {children}
                </a>
              ),
              code: ({ children, className }) => {
                const isInline = !className;

                if (isInline) {
                  return (
                    <code
                      className={`rounded px-1 py-0.5 font-mono text-[0.85em] ${isUser ? "bg-white/15 text-white" : "bg-neutral-100 text-neutral-900"}`}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <code className="block overflow-x-auto whitespace-pre p-3 font-mono text-xs leading-5">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre
                  className={`mb-3 overflow-hidden rounded-md border text-left last:mb-0 ${isUser ? "border-white/10 bg-white/10 text-white" : "border-neutral-200 bg-neutral-950 text-neutral-50"}`}
                >
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="mb-3 overflow-x-auto rounded-md border border-neutral-200 last:mb-0">
                  <table className="min-w-full border-collapse text-left text-xs">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 font-semibold text-neutral-700">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-neutral-100 px-3 py-2 align-top">
                  {children}
                </td>
              ),
              hr: () => (
                <hr
                  className={`my-4 border-0 border-t ${isUser ? "border-white/20" : "border-neutral-200"}`}
                />
              ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </article>
  );
}
