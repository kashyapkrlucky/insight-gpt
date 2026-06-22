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
        <p className="text-sm text-red-600">File processing failed</p>
      ) : fileProcessingStatus === "ready" ? (
        <div className="text-sm text-green-600">
          Selene is ready to answer your questions
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
          Preparing file
        </div>
      )}
    </div>
  );
}
