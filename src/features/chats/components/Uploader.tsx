"use client";
import { useRef, useState } from "react";
import { useChatStore } from "@/features/chats/store/useChatStore";
import { Button } from "@/shared/ui/Button";
import { FileTextIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { storageClientService } from "@/infra/storage/services/StorageClientService";
import useAuthStore from "@/features/auth/store/useAuthStore";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/shared/lib/errors";

export default function Uploader() {
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { createDocument, isFileUploading, setFileUploading } = useChatStore();
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };
  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!user?.id) {
      toast.error("Please sign in before uploading a file.");
      return;
    }

    try {
      setFileUploading(true);
      const { data, error, success } = await storageClientService.uploadFile(
        selectedFile,
        user.id,
      );

      if (!success || !data) {
        throw new Error(error || "Failed to upload file.");
      }

      const didCreateDocument = await createDocument(data);
      if (didCreateDocument) {
        clearSelectedFile();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload file."));
      setFileUploading(false);
    }
  };
  const handleRemoveFile = () => {
    clearSelectedFile();
  };

  return (
    <>
      <div className="relative h-36">
        <label
          className="grid h-full cursor-pointer place-items-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center transition hover:border-neutral-500 hover:bg-white has-disabled:pointer-events-none has-disabled:opacity-70"
        >
          <input
            ref={inputRef}
            accept=".pdf,image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleFileInput}
            type="file"
            disabled={Boolean(selectedFile) || isFileUploading}
          />
          <span className="flex flex-col items-center">
            <span className="mx-auto grid size-10 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 shadow-sm">
              <UploadCloudIcon className="h-5 w-5" />
            </span>
            <span className="mt-3 block text-sm font-semibold text-neutral-950">
              Upload PDF
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              Drop in a document to start a chat
            </span>
          </span>
        </label>

        {selectedFile && (
          <div className="absolute left-0 top-0 flex h-full w-full flex-col justify-between overflow-hidden rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="flex justify-end">
              <button
                aria-label="Remove selected file"
                onClick={handleRemoveFile}
                disabled={isFileUploading}
                className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-3 text-center">
              <span className="grid size-10 place-items-center rounded-md bg-neutral-100 text-neutral-700">
                <FileTextIcon className="h-5 w-5" />
              </span>
              <div className="line-clamp-2 text-xs font-medium text-neutral-800">
                {selectedFile.name}
              </div>
              <div className="text-xs text-neutral-500">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="flex items-center justify-end">
          <Button
            onClick={handleUpload}
            loading={isFileUploading}
            disabled={isFileUploading}
            fullWidth
          >
            {isFileUploading ? "Uploading" : "Upload"}
          </Button>
        </div>
      )}
    </>
  );
}
