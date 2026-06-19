"use client";
import { useChatStore } from "@/features/chats/store/useChatStore";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

export default function FileLoaded() {
  const { trigger } = useChatStore();

  const { run } = useRealtimeRun(trigger.id || "", {
    accessToken: trigger.publicAccessToken || "",
  });
  return (
    <div>
      {run?.error && <p>Error {run?.error?.message}</p>}
      <div className="text-green-600 text-sm">Selene is ready to answer your questions</div>
    </div>
  );
}
