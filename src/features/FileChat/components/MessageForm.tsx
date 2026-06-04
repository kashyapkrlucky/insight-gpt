"use client";

import Image from "next/image";
import { type FormEvent, type KeyboardEvent, useState } from "react";

type MessageFormProps = {
  readonly disabled: boolean;
  readonly isSending: boolean;
  readonly onSubmit: (content: string) => void;
};

export function MessageForm({ disabled, isSending, onSubmit }: MessageFormProps) {
  const canSubmit = !disabled && !isSending;
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (canSubmit) {
      onSubmit(value);
      setValue("");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    if (canSubmit) {
      onSubmit(value);
      setValue("");
    }
  }

  return (
    <form className="border-t border-neutral-200 bg-white px-4 py-4 sm:px-6" onSubmit={handleSubmit}>
      <div className={`mx-auto flex w-full max-w-3xl items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 transition focus-within:border-neutral-400 focus-within:shadow-md ${disabled ? "opacity-50" : ""}`}>
        <textarea
          className="max-h-36 min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 text-neutral-950 outline-none placeholder:text-neutral-400 disabled:text-neutral-400"
          disabled={disabled || isSending}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Upload a file to chat" : "Ask about this file"}
          rows={1}
          value={value}
        />
        <button
          aria-label={isSending ? "Reading" : "Send message"}
          disabled={!canSubmit || isSending}
          type="submit"
        >
          <Image src="/send.svg" alt="Send" width={24} height={24} />
        </button>
      </div>
    </form>
  );
}
