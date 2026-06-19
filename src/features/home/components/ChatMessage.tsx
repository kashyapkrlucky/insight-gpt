import { type Message } from "@/features/chats/types";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatMessage({ message }: { message: Message }) {
  return (
    <article
      className={`mb-7 flex gap-3 ${message.author === "user" ? "justify-end" : "justify-start"}`}
      key={message.id}
    >
      <div
        className={`max-w-[min(680px,88%)] flex flex-row items-start gap-3 text-sm leading-6 bg-white p-4 rounded-lg shadow-sm ${
          message.author === "user"
            ? "bg-neutral-100 text-neutral-950"
            : "text-neutral-900"
        }`}
      >
        {message.author === "assistant" && (
          <Image
            alt=""
            className="object-cover rounded-full border-2 border-neutral-200"
            priority
            width={32}
            height={32}
            src="/bot.jpg"
          />
        )}
        <div className="flex flex-col gap-2 ">
          <div className="text-xs font-medium text-neutral-500">
            {message.author === "user" ? "You" : "Assistant"}
          </div>
          <div className="prose prose-neutral max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {message.author === "user" && (
          <div className="w-8 h-8 bg-neutral-200 rounded-full">
            <Image
              alt=""
              className="object-cover rounded-full border-2 border-neutral-200"
              priority
              width={32}
              height={32}
              src="/circle-user-round.svg"
            />
          </div>
        )}
      </div>
    </article>
  );
}
