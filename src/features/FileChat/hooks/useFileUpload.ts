"use client";

import { ChatMessage } from "@/shared/types";
import { createMessage, validateUploadFile } from "@/features/FileChat/utils/files";
import { useMemo, useState } from "react";

interface UseFileUploadProps {
  file: File | null;
  fileStatus: string;
  previewUrl: string | null;
  error: string | null;
  setPreviewUrl: (url: string | null) => void;
  setFile: (file: File | null) => void;
  clearFile: () => void;
  onFileSelect: (file: File) => void;
  setError: (error: string | null) => void;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isSending: boolean;
}

export function useFileUpload(): UseFileUploadProps {
  const [file, setFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  function revokePreview(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }
  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const fileStatus = useMemo(() => {
    if (!file) return "No file";
    if (file.type === "application/pdf") return "attached PDF";
    return "attached image";
  }, [file]);

  const onFileSelect = (currentFile: File) => {
    const validation = validateUploadFile(currentFile);
    setError(null);

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    revokePreview();
    setFile(currentFile);
    setPreviewUrl(
      currentFile.type.startsWith("image/")
        ? URL.createObjectURL(currentFile)
        : null,
    );
    setMessages([
      createMessage(
        "assistant",
        `I have ${currentFile.name}. Ask away and I will keep the analysis sharp with only snack-sized jokes.`,
      ),
    ]);
  };

  const sendMessage = async (content: string) => {
    // TODO: Implement API call to send message
    console.log("Sending message:", content);
    const trimmedContent = content.trim();
    if (!file || !trimmedContent || isSending) return;

    const userMessage = createMessage("user", trimmedContent);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
      setIsSending(true);

    try {
      const reply = "I'm processing your request...";
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 2000);
      });
      await promise;
      setMessages([...nextMessages, createMessage("assistant", reply)]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return {
    file,
    fileStatus,
    previewUrl,
    error,
    setFile,
    setPreviewUrl,
    clearFile,
    onFileSelect,
    setError,
    messages,
    sendMessage,
    isSending,
  };
}
