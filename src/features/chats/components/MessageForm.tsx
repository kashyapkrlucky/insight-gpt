import { useState, type KeyboardEvent } from "react";
import { useChatStore } from "@/features/chats/store/useChatStore";
import { SendHorizontalIcon } from "lucide-react";

export default function MessageForm() {
  const [question, setQuestion] = useState("");
  const { currentChat, fileProcessingStatus, sendMessage, isSendingMessage } =
    useChatStore();
  const isFileReady = fileProcessingStatus === "ready";
  const isDisabled = !currentChat || !isFileReady || isSendingMessage;
  const placeholder = !currentChat
    ? "Upload a file to chat"
    : fileProcessingStatus === "failed"
      ? "File processing failed"
      : !isFileReady
        ? "Preparing file..."
        : "Ask about this pdf";

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    if (question.trim() && !isDisabled) {
      onSubmit();
    }
  }
  const onSubmit = async () => {
    const trimmedQuestion = question.trim();
    if (!currentChat || !trimmedQuestion || isDisabled) return;
    setQuestion("");
    await sendMessage(trimmedQuestion, currentChat.id);
  };
  return (
    <div
      className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-md border border-neutral-200 bg-white p-2 shadow-sm transition focus-within:border-neutral-400 focus-within:shadow-md"
    >
      <textarea
        className="max-h-40 min-h-12 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-neutral-950 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:text-neutral-400"
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={placeholder}
        value={question}
        disabled={isDisabled}
      />
      <button
        aria-label="Send message"
        disabled={question.trim() === "" || isDisabled}
        onClick={onSubmit}
        className="grid size-10 shrink-0 place-items-center rounded-md bg-neutral-950 text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        <SendHorizontalIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
