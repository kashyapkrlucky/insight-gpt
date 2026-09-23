"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "../store/useChatStore";

/** Uploads a PDF, then navigates to its new chat. */
export function useUploadAndOpen() {
  const router = useRouter();
  const uploadDocument = useChatStore((state) => state.uploadDocument);

  return useCallback(
    async (file: File) => {
      const chat = await uploadDocument(file);
      if (chat) router.push(`/chat/${chat.id}`);
      return chat;
    },
    [router, uploadDocument],
  );
}
