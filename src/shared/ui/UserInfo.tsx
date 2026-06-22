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
            className="h-9 w-9 rounded-md ring-1 ring-neutral-200 transition-all duration-200 group-hover:ring-neutral-300"
          />
        </div>
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-950 text-sm font-semibold text-white ring-1 ring-neutral-200 transition-all duration-200">
          {getInitials(user)}
        </div>
      )}

      {showEmail ? (
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-neutral-800">
            {getDisplayName(user)}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {user?.email || "No email"}
          </p>
        </div>
      ) : (
        <p className="hidden truncate text-sm font-semibold text-neutral-800 md:block">
          {getDisplayName(user)}
        </p>
      )}
    </div>
  );
}
