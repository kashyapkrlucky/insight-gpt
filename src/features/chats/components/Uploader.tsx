"use client";
import { useState } from "react";
import { useChatStore } from "@/features/chats/store/useChatStore";
import { Button } from "@/shared/ui/Button";
import { FileTextIcon, XIcon } from "lucide-react";

export default function Uploader() {
  const [selectedFile, setSelecteedFile] = useState<File | null>(null);
  const { uploadFile, loading } = useChatStore();
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelecteedFile(e.target.files?.[0] || null);
  };
  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    
    await uploadFile(formData);
    setSelecteedFile(null);
  };
  const handleRemoveFile = () => {
    setSelecteedFile(null);
  };

  return (
    <>
      <div className="relative h-32 ">
        <label
          className={`grid cursor-pointer place-items-center rounded-xl border border-dashed p-4 text-center transition border-neutral-300 bg-neutral-50 hover:border-neutral-500`}
        >
          <input
            accept=".pdf,image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleFileInput}
            type="file"
            disabled={Boolean(selectedFile)}
          />
          <span>
            <span className="mx-auto grid size-10 place-items-center rounded-lg border border-neutral-200 bg-white text-xl font-medium text-neutral-800 shadow-sm">
              +
            </span>
            <span className="mt-3 block text-sm font-medium text-neutral-950">
              Upload PDF
            </span>
          </span>
        </label>

        {selectedFile && (
          <div className="absolute top-0 left-0 w-full h-full bg-white p-2 rounded-md overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex justify-end">
              <button
                onClick={handleRemoveFile}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <FileTextIcon className="w-8 h-8" />
              <div className="text-xs break-words px-4">{selectedFile.name}</div>
            </div>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="flex items-center justify-end gap-2">
          <Button onClick={handleUpload} loading={loading}>
            Upload
          </Button>
        </div>
      )}
    </>
  );
}
