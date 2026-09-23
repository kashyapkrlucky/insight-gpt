"use client";

import { useEffect, useRef, useState } from "react";
import { FileUpIcon } from "lucide-react";

const hasFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes("Files");

/**
 * Full-window drop target: drag a PDF anywhere in the app to start a chat.
 */
export function FileDropOverlay({
  onDrop,
  disabled = false,
}: {
  onDrop: (file: File) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const depth = useRef(0);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  });

  useEffect(() => {
    if (disabled) return;

    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setIsDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    };
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setIsDragging(false);
    };
    const onDropEvent = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setIsDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) onDropRef.current(file);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDropEvent);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDropEvent);
      depth.current = 0;
      setIsDragging(false);
    };
  }, [disabled]);

  if (!isDragging) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid animate-fade-in place-items-center bg-bg/80 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-dashed border-accent bg-surface/90 px-8 py-12 text-center shadow-float">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <FileUpIcon className="size-7" />
        </span>
        <p className="mt-4 text-lg font-semibold text-fg">Drop your PDF</p>
        <p className="mt-1 text-sm text-muted">
          We&apos;ll upload it and start a new chat.
        </p>
      </div>
    </div>
  );
}
