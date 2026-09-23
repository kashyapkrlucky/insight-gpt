"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpIcon } from "lucide-react";
import { ASSISTANT_NAME, MAX_MESSAGE_CHARS } from "@/shared/constants";
import { COMPOSER_ID } from "@/shared/hooks/useKeyboardShortcuts";
import { Spinner } from "@/shared/ui/Spinner";
import { cn } from "@/shared/utils";

const MAX_HEIGHT_PX = 200;

type ComposerProps = {
  onSend: (text: string) => void;
  /** Blocks typing (e.g. the document isn't ready). */
  disabled?: boolean;
  /** Blocks sending but allows drafting (e.g. an answer is streaming). */
  isBusy?: boolean;
  placeholder?: string;
};

export function Composer({
  onSend,
  disabled = false,
  isBusy = false,
  placeholder = "Ask a question about this PDF…",
}: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const isTooLong = value.length > MAX_MESSAGE_CHARS;
  const canSend = !disabled && !isBusy && trimmed.length > 0 && !isTooLong;
  const showCount = value.length > MAX_MESSAGE_CHARS * 0.8;

  // Grow with the content up to MAX_HEIGHT_PX, then scroll.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  const submit = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border bg-surface p-2 pl-4 shadow-soft transition-[border-color,box-shadow]",
          "focus-within:border-border-strong focus-within:shadow-float",
          disabled && "opacity-70",
        )}
      >
        <label htmlFor={COMPOSER_ID} className="sr-only">
          Message {ASSISTANT_NAME}
        </label>
        <textarea
          id={COMPOSER_ID}
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={isTooLong || undefined}
          className="max-h-[200px] min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 text-fg outline-none placeholder:text-subtle focus-visible:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!canSend}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:bg-surface-3 disabled:text-subtle"
        >
          {isBusy ? <Spinner className="size-4" /> : <ArrowUpIcon className="size-5" />}
        </button>
      </form>
      <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between gap-3 px-1 text-[11px] text-subtle">
        <span>
          {ASSISTANT_NAME} answers from your document only.{" "}
          <span className="hidden sm:inline">
            Enter to send, Shift+Enter for a new line.
          </span>
        </span>
        {showCount && (
          <span className={cn("tabular-nums", isTooLong && "font-medium text-danger")}>
            {value.length.toLocaleString()}/{MAX_MESSAGE_CHARS.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
