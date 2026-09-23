"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal confirm built on the native <dialog>, which provides focus trapping,
 * Escape to close and an accessible modal role for free.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onCancel();
      }}
      onClick={(event) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (event.target === ref.current && !loading) onCancel();
      }}
      aria-labelledby="confirm-dialog-title"
      className="m-auto w-[min(92vw,420px)] rounded-2xl border border-border bg-surface p-0 text-fg shadow-float open:animate-slide-up"
    >
      <div className="p-5">
        <h2 id="confirm-dialog-title" className="text-base font-semibold">
          {title}
        </h2>
        {description && (
          <div className="mt-2 text-sm leading-6 text-muted">{description}</div>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-surface-2/50 px-5 py-3">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
          loading={loading}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
