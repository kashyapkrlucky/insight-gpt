"use client";

import { CircleAlertIcon, FileTextIcon, SparklesIcon } from "lucide-react";
import type { FileProcessingStatus } from "../store/useChatStore";
import { displayTitle } from "../utils/groupChats";
import { ASSISTANT_NAME, STARTER_PROMPTS } from "@/shared/constants";
import { Spinner } from "@/shared/ui/Spinner";

type EmptyChatProps = {
  title: string;
  status: FileProcessingStatus;
  error?: string | null;
  onPrompt: (prompt: string) => void;
};

export function EmptyChat({ title, status, error, onPrompt }: EmptyChatProps) {
  const isReady = status === "ready";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
        <div className="flex animate-slide-up flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-border bg-surface text-accent shadow-soft">
            <FileTextIcon className="size-6" />
          </span>
          <h2 className="mt-4 max-w-full truncate text-xl font-semibold tracking-tight text-fg">
            {displayTitle(title)}
          </h2>

          {status === "processing" && (
            <p
              aria-live="polite"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning"
            >
              <Spinner className="size-3 border-[1.5px]" />
              Reading and indexing your document. This usually takes under a minute.
            </p>
          )}
          {status === "failed" && (
            <div
              role="alert"
              className="mt-4 flex max-w-md items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-left text-sm text-danger"
            >
              <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">We couldn&apos;t read this PDF</p>
                <p className="mt-0.5 leading-6 opacity-90">
                  {error ??
                    "Something went wrong while indexing it. Try uploading it again, or use a PDF with selectable text."}
                </p>
              </div>
            </div>
          )}
          {isReady && (
            <p className="mt-2 text-sm text-muted">
              Ask {ASSISTANT_NAME} anything about this document, or start with one
              of these:
            </p>
          )}
        </div>

        {status !== "failed" && (
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {STARTER_PROMPTS.map((prompt, index) => (
              <button
                key={prompt}
                type="button"
                disabled={!isReady}
                onClick={() => onPrompt(prompt)}
                style={{ animationDelay: `${index * 40}ms` }}
                className="group flex animate-slide-up items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-fg shadow-soft transition-colors [animation-fill-mode:backwards] hover:border-accent/50 hover:bg-accent-soft/40 disabled:pointer-events-none disabled:opacity-50"
              >
                <SparklesIcon className="size-4 shrink-0 text-accent" />
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
