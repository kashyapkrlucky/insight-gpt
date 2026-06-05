"use client";
import {
  APP_NAME,
  MAX_UPLOAD_BYTES,
  STARTER_PROMPTS,
} from "@/shared/constants";
import { formatBytes } from "@/features/FileChat/utils/files";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { UploadedFileSummary } from "@/shared/types";
import Image from "next/image";
import { UserMenu } from "@/shared/ui/UserMenu";

interface SideBarProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  clearFile: () => void;
  previewUrl: string | null;
  sendMessage: (message: string) => void;
  isSending: boolean;
}

export function SideBar({
  file,
  onFileSelect,
  clearFile,
  previewUrl,
  sendMessage,
  isSending,
}: SideBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileSummary: UploadedFileSummary | null = file
    ? {
        name: file.name,
        type: file.type || "Unknown type",
        size: file.size,
      }
    : null;

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const selectedFile = event.target.files?.item(0);
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files.item(0);
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  }
  return (
    <aside className="w-[320px] border-r border-neutral-200 bg-white p-5 flex flex-col gap-4">
      <header className="flex items-center gap-3 px-1">
        <div className="grid size-9 place-items-center rounded-md bg-neutral-950 text-xs font-bold text-white">
          IGPT
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {APP_NAME}
          </h1>
          <p className="truncate text-xs text-neutral-500">
            Personal Assistant
          </p>
        </div>
      </header>
      <section className="flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
              Source
            </p>
            <h2 className="mt-1 text-sm font-semibold text-neutral-950">
              Document context
            </h2>
          </div>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-500">
            {formatBytes(MAX_UPLOAD_BYTES)} max
          </span>
        </div>

        <div className="h-auto">
          <label
            className={`mt-3 grid min-h-36 cursor-pointer place-items-center rounded-xl border border-dashed p-4 text-center transition ${
              isDragging
                ? "border-neutral-900 bg-neutral-100"
                : "border-neutral-300 bg-neutral-50 hover:border-neutral-500"
            }`}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              accept=".pdf,image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={handleInputChange}
              type="file"
              disabled={Boolean(file)}
            />
            <span>
              <span className="mx-auto grid size-10 place-items-center rounded-lg border border-neutral-200 bg-white text-xl font-medium text-neutral-800 shadow-sm">
                +
              </span>
              <span className="mt-3 block text-sm font-medium text-neutral-950">
                Upload PDF or image
              </span>
              <span className="mt-1 block text-xs text-neutral-500">
                PDF, PNG, JPG, WEBP, GIF
              </span>
            </span>
          </label>

          {fileSummary && (
            <section className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-neutral-950">
                    {fileSummary.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {fileSummary.type} / {formatBytes(fileSummary.size)}
                  </p>
                </div>
                <button
                  className="rounded-md px-2 py-1 text-xs"
                  onClick={clearFile}
                  type="button"
                >
                  Clear
                </button>
              </div>

              {previewUrl ? (
                <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                  <Image
                    alt="Uploaded file preview"
                    className="object-contain"
                    fill
                    sizes="320px"
                    src={previewUrl}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-6 text-center">
                  <p className="text-sm font-medium text-neutral-800">
                    PDF attached
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Ready for questions
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="mt-5 border-t border-neutral-200 pt-4">
          <p className="px-1 text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
            Prompts
          </p>
          <div className="mt-2 grid gap-1.5">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                className={`rounded-lg px-3 py-2.5 text-left text-sm border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 ${
                  isSending ? "cursor-not-allowed" : ""
                }`}
                disabled={!Boolean(file) || isSending}
                key={prompt}
                onClick={() => sendMessage(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-gray-300">
        <UserMenu />
      </footer>
    </aside>
  );
}
