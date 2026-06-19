import { useState, type KeyboardEvent } from "react";
import { useChatStore } from "@/features/chats/store/useChatStore";
import Image from "next/image";

export default function MessageForm() {
  const [question, setQuestion] = useState("");
  const { currentChat, sendMessage, inlineLoading } = useChatStore();

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    if (question) {
      onSubmit();
      setQuestion("");
    }
  }
  const onSubmit = async () => {
    if (!currentChat) return;
    sendMessage(question, currentChat?.id);
    setQuestion("");
  };
  return (
    <div
      className={`mx-auto flex w-full max-w-3xl items-center gap-2 rounded-xl border border-neutral-200 bg-white transition focus-within:border-neutral-400 focus-within:shadow-md`}
    >
      <textarea
        className="p-4 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 text-neutral-950 outline-none placeholder:text-neutral-400 disabled:text-neutral-400"
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={currentChat ? "Ask about this pdf" : "Upload a file to chat"}
        value={question}
      />
      <button
        aria-label={"Send message"}
        disabled={question.trim() === "" || inlineLoading}
        onClick={onSubmit}
        className="p-4"
      >
        <Image src="/send.svg" alt="Send" width={24} height={24} />
      </button>
    </div>
  );
}
