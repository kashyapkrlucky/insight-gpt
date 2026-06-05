"use client";
import { SideBar } from "@/features/FileChat/components/SideBar";
import { useFileUpload } from "@/features/FileChat/hooks/useFileUpload";
import { ASSISTANT_NAME } from "@/shared/constants";
import { Badge } from "@/shared/ui/Badge";
import Image from "next/image";
import { MessageList } from "@/features/FileChat/components/MessageList";
import { MessageForm } from "@/features/FileChat/components/MessageForm";
import { useEffect, useState } from "react";
import PageLoader from "@/shared/ui/PageLoader";
import { getCodeFromURL } from "@/features/auth/utils";
import useAuthStore from "@/features/auth/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const { file, onFileSelect, clearFile, previewUrl, fileStatus, messages, isSending, sendMessage } =
    useFileUpload();
  const { getUserData, isAuthenticated, loading } = useAuthStore();
  const [isOAuthChecked, setIsOAuthChecked] = useState(false);

  const router = useRouter();


  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = getCodeFromURL();
      if (code) {
        try {
          await getUserData(code);
          setIsOAuthChecked(true);
        } catch (error) {
          console.error("OAuth callback failed:", error);
        }
      } else {
        setIsOAuthChecked(true);
      }
    };

    handleOAuthCallback();
  }, [getUserData]);

  useEffect(() => {
    if (isOAuthChecked && !isAuthenticated && !loading) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, isOAuthChecked, router]);
  
  if (loading && !isOAuthChecked) {
    return <PageLoader />;
  }

  return (
    <main className="flex flex-row h-screen overflow-hidden bg-gray-50 text-gray-900">
      <SideBar
        file={file}
        onFileSelect={onFileSelect}
        clearFile={clearFile}
        previewUrl={previewUrl}
        sendMessage={sendMessage}
        isSending={isSending}
      />
      <div className="flex-1 flex flex-col">
        <header className="flex min-h-14 items-center justify-between border-b border-neutral-200 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/bot.jpg"
              alt="Logo"
              className="h-8 w-8 border border-neutral-200 rounded-full"
              width={32}
              height={32}
            />
            <div>
              <p className="text-sm font-medium text-neutral-950">
                {ASSISTANT_NAME}
              </p>
              <p className="text-xs text-neutral-500">
                {fileStatus === "No file"
                  ? "Upload a file to get started"
                  : `Ask questions about ${fileStatus}`}
              </p>
            </div>
          </div>
          <Badge>Private session</Badge>
        </header>

        <section className="flex-1 p-4 overflow-y-auto">
          <MessageList messages={messages} isSending={isSending} />
        </section>
        <footer>
          <MessageForm disabled={!file} isSending={isSending} onSubmit={sendMessage} />
        </footer>
      </div>
    </main>
  );
}
