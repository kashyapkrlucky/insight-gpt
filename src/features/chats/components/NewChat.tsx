"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileSearchIcon,
  FileUpIcon,
  QuoteIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useUploadAndOpen } from "../hooks/useUploadAndOpen";
import { TopBar } from "./TopBar";
import { Spinner } from "@/shared/ui/Spinner";
import { Kbd } from "@/shared/ui/Kbd";
import { MAX_UPLOAD_BYTES } from "@/shared/constants";
import { MOD_KEY } from "@/shared/hooks/useKeyboardShortcuts";
import { cn, formatBytes } from "@/shared/utils";

const FEATURES = [
  {
    icon: FileSearchIcon,
    title: "Ask anything",
    text: "Summaries, key points, definitions, or a specific clause.",
  },
  {
    icon: QuoteIcon,
    title: "Grounded answers",
    text: "Answers come only from your document, never made up.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Private to you",
    text: "Files are stored in your own space and only you can query them.",
  },
];

const STAGE_LABEL = {
  idle: "",
  uploading: "Uploading your PDF…",
  registering: "Setting up your chat…",
} as const;

export default function NewChat() {
  const setCurrentChat = useChatStore((state) => state.setCurrentChat);
  const isFileUploading = useChatStore((state) => state.isFileUploading);
  const uploadStage = useChatStore((state) => state.uploadStage);
  const uploadAndOpen = useUploadAndOpen();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    setCurrentChat(null);
  }, [setCurrentChat]);

  const startUpload = async (file: File) => {
    setFileName(file.name);
    const chat = await uploadAndOpen(file);
    if (!chat) {
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <TopBar>
        <h1 className="text-sm font-medium text-fg">New chat</h1>
      </TopBar>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-balance text-fg sm:text-3xl">
              What would you like to understand?
            </h2>
            <p className="mt-2 text-sm text-pretty text-muted sm:text-base">
              Upload a PDF and ask questions in plain language.
            </p>
          </div>

          <label
            className={cn(
              "group mt-8 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-border-strong bg-surface px-6 py-10 text-center shadow-soft transition-colors",
              "hover:border-accent hover:bg-accent-soft/40 focus-within:border-accent",
              isFileUploading && "pointer-events-none",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              disabled={isFileUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) startUpload(file);
              }}
            />

            {isFileUploading ? (
              <div className="flex flex-col items-center" aria-live="polite">
                <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <Spinner className="size-5" />
                </span>
                <p className="mt-4 max-w-full truncate text-sm font-medium text-fg">
                  {fileName}
                </p>
                <p className="mt-1 text-sm text-muted">{STAGE_LABEL[uploadStage]}</p>
                <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cn(
                      "h-full rounded-full bg-accent transition-[width] duration-700 ease-out",
                      uploadStage === "registering" ? "w-4/5" : "w-2/5",
                    )}
                  />
                </div>
              </div>
            ) : (
              <>
                <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent transition-transform group-hover:-translate-y-0.5">
                  <FileUpIcon className="size-6" />
                </span>
                <p className="mt-4 text-sm font-medium text-fg">
                  <span className="text-accent">Choose a PDF</span> or drag it
                  anywhere
                </p>
                <p className="mt-1 text-xs text-muted">
                  PDF up to {formatBytes(MAX_UPLOAD_BYTES)}
                </p>
              </>
            )}
          </label>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <Icon className="size-4 text-accent" />
                <p className="mt-2 text-sm font-medium text-fg">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
              </li>
            ))}
          </ul>

          <p className="mt-8 hidden items-center justify-center gap-1.5 text-xs text-subtle md:flex">
            Tip: press <Kbd>{MOD_KEY}</Kbd>
            <Kbd>K</Kbd> for a new chat anytime
          </p>
        </div>
      </div>
    </>
  );
}
