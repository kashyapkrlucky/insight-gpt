"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/shared/ui/PageLoader";
import { getCodeFromURL } from "@/features/auth/utils";
import useAuthStore from "@/features/auth/store/useAuthStore";
import { useRouter } from "next/navigation";
import LeftSideBar from "@/features/chats/components/LeftSideBar";
import ChatContainer from "@/features/chats/components/ChatContainer";
import toast from "react-hot-toast";

export default function Home() {
  const { getUserData, isAuthenticated, loading } = useAuthStore();
  const [isOAuthChecked, setIsOAuthChecked] = useState(false);

  const router = useRouter();

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
        } finally {
          setIsOAuthChecked(true);
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

  if (loading || !isOAuthChecked) {
    return <PageLoader />;
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-neutral-50 text-neutral-950 md:flex-row">
      <LeftSideBar />
      <ChatContainer />
    </main>
  );
}
