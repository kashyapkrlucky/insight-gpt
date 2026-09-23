"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageLoader from "@/shared/ui/PageLoader";
import { getCodeFromURL } from "@/features/auth/utils";
import useAuthStore from "@/features/auth/store/useAuthStore";
import { useChatStore } from "@/features/chats/store/useChatStore";
import { Sidebar } from "@/features/chats/components/Sidebar";
import { FileDropOverlay } from "@/features/chats/components/FileDropOverlay";
import { useUploadAndOpen } from "@/features/chats/hooks/useUploadAndOpen";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";
import { useIsDesktop } from "@/shared/hooks/useMediaQuery";
import { useUIStore } from "@/shared/store/useUIStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { getUserData, isAuthenticated, loading } = useAuthStore();
  const [isOAuthChecked, setIsOAuthChecked] = useState(false);
  const router = useRouter();

  // Complete an Atlas ID sign-in redirect (?c=<code>) on any app route.
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = getCodeFromURL();
      if (code) {
        try {
          const result = await getUserData(code);
          if (!result) {
            toast.error("Failed to complete sign in. Please try again.");
          }
        } catch (error) {
          console.error("OAuth callback failed:", error);
          toast.error("Failed to complete sign in. Please try again.");
        }
      }
      setIsOAuthChecked(true);
    };

    handleOAuthCallback();
  }, [getUserData]);

  useEffect(() => {
    if (isOAuthChecked && !isAuthenticated && !loading) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, isOAuthChecked, router]);

  if (loading || !isOAuthChecked || !isAuthenticated) {
    return <PageLoader />;
  }

  return <AppShell>{children}</AppShell>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const getChats = useChatStore((state) => state.getChats);
  const isFileUploading = useChatStore((state) => state.isFileUploading);
  const { setSidebarOpen, toggleSidebarCollapsed } = useUIStore();
  const uploadAndOpen = useUploadAndOpen();

  useEffect(() => {
    getChats();
  }, [getChats]);

  // Close the mobile drawer after navigating.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  useKeyboardShortcuts({
    onNewChat: () => router.push("/"),
    onToggleSidebar: () =>
      isDesktop
        ? toggleSidebarCollapsed()
        : setSidebarOpen(!useUIStore.getState().isSidebarOpen),
  });

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      <FileDropOverlay onDrop={uploadAndOpen} disabled={isFileUploading} />
    </div>
  );
}
