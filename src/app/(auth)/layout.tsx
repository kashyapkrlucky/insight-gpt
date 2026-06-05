"use client"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
