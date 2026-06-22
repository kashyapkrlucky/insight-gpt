"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/shared/ui/PageLoader";
import useAuthStore from "@/features/auth/store/useAuthStore";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <PageLoader />;
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      {children}
    </div>
  );
}
