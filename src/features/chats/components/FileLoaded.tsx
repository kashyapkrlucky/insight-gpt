"use client";
import { useChatStore } from "@/features/chats/store/useChatStore";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useEffect } from "react";

export default function FileLoaded() {
  const { fileProcessingStatus, setFileProcessingStatus, trigger } =
    useChatStore();

  const { error, run } = useRealtimeRun(trigger.id || "", {
    accessToken: trigger.publicAccessToken || "",
  });

  const isReady = run?.status === "COMPLETED";
  const didFail =
    Boolean(error || run?.error) ||
    ["FAILED", "CRASHED", "SYSTEM_FAILURE", "TIMED_OUT", "CANCELED"].includes(
      run?.status || "",
    );

  useEffect(() => {
    if (!trigger.id) return;

    if (didFail) {
      setFileProcessingStatus("failed");
      return;
    }

    if (isReady) {
      setFileProcessingStatus("ready");
      return;
    }

    setFileProcessingStatus("processing");
  }, [didFail, isReady, setFileProcessingStatus, trigger.id]);

  return (
    <div>
      {fileProcessingStatus === "failed" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700">
          File processing failed
        </p>
      ) : fileProcessingStatus === "ready" ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
          Ready
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-600">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
          Preparing file
        </div>
      )}
    </div>
  );
}
