"use client";

import { useEffect } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useChatStore, type FileProcessingStatus } from "../store/useChatStore";
import { Spinner } from "@/shared/ui/Spinner";
import { cn } from "@/shared/utils";

const FAILED_STATUSES = [
  "FAILED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
  "CANCELED",
];

/** Follows the indexing run for a freshly uploaded document. */
function IndexingRunWatcher({
  runId,
  accessToken,
}: {
  runId: string;
  accessToken: string;
}) {
  const setFileProcessingStatus = useChatStore(
    (state) => state.setFileProcessingStatus,
  );
  const { error, run } = useRealtimeRun(runId, { accessToken });

  const isReady = run?.status === "COMPLETED";
  const didFail =
    Boolean(error || run?.error) ||
    FAILED_STATUSES.includes(run?.status || "");
  const failureReason =
    run?.status === "FAILED" ? (run.error?.message ?? null) : null;

  useEffect(() => {
    setFileProcessingStatus(
      didFail ? "failed" : isReady ? "ready" : "processing",
      didFail ? failureReason : null,
    );
  }, [didFail, isReady, failureReason, setFileProcessingStatus]);

  return null;
}

const POLL_INTERVAL_MS = 4000;

/**
 * Without a live run to follow (e.g. after a reload mid-indexing), polls the
 * document status until indexing finishes.
 */
function DocumentStatusPoller({ chatId }: { chatId: string }) {
  const refreshDocumentStatus = useChatStore(
    (state) => state.refreshDocumentStatus,
  );

  useEffect(() => {
    const interval = setInterval(
      () => refreshDocumentStatus(chatId),
      POLL_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [chatId, refreshDocumentStatus]);

  return null;
}

const PILL: Record<
  Exclude<FileProcessingStatus, "idle">,
  { label: string; className: string }
> = {
  processing: {
    label: "Indexing",
    className: "bg-warning-soft text-warning",
  },
  ready: { label: "Ready", className: "bg-success-soft text-success" },
  failed: { label: "Failed", className: "bg-danger-soft text-danger" },
};

export function FileStatus() {
  const status = useChatStore((state) => state.fileProcessingStatus);
  const trigger = useChatStore((state) => state.trigger);
  const chatId = useChatStore((state) => state.currentChat?.id);
  const refreshDocumentStatus = useChatStore(
    (state) => state.refreshDocumentStatus,
  );

  // Once a live run settles, sync the stored status into the chat list.
  useEffect(() => {
    if (chatId && trigger.id && status !== "processing") {
      refreshDocumentStatus(chatId);
    }
  }, [chatId, trigger.id, status, refreshDocumentStatus]);

  const hasLiveRun = Boolean(trigger.id && trigger.publicAccessToken);

  return (
    <>
      {hasLiveRun && (
        <IndexingRunWatcher
          runId={trigger.id!}
          accessToken={trigger.publicAccessToken!}
        />
      )}
      {!hasLiveRun && status === "processing" && chatId && (
        <DocumentStatusPoller chatId={chatId} />
      )}
      {status !== "idle" && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
            PILL[status].className,
          )}
        >
          {status === "processing" ? (
            <Spinner className="size-2.5 border-[1.5px]" />
          ) : (
            <span className="size-1.5 rounded-full bg-current" />
          )}
          {PILL[status].label}
        </span>
      )}
    </>
  );
}
