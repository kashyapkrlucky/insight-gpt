"use client";

import useAuthStore from "@/features/auth/store/useAuthStore";
import { getDisplayName, getInitials } from "../utils";
import Image from "next/image";

export function UserInfo({ showEmail = true }: { showEmail?: boolean }) {
  const { user } = useAuthStore();
  if (!user) {
    return null;
  }

  return (
    <div className="flex-1 flex min-w-0 items-center gap-3">
      {user && user.avatar ? (
        <div className="relative">
          <Image
            src={user.avatar}
            alt="User avatar"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg ring-1 ring-sky-300/20 transition-all duration-200 group-hover:ring-sky-300/50"
          />
        </div>
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-300/15 text-sm font-semibold text-sky-100 ring-1 ring-sky-300/20 transition-all duration-200 group-hover:ring-sky-300/50">
          {getInitials(user)}
        </div>
      )}

      {showEmail ? (
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-slate-800">
            {getDisplayName(user)}
          </p>
          <p className="truncate text-xs text-[var(--muted)]">
            {user?.email || "No email"}
          </p>
        </div>
      ) : (
        <p className="hidden truncate text-sm font-semibold text-slate-800 md:block">
          {getDisplayName(user)}
        </p>
      )}
    </div>
  );
}
