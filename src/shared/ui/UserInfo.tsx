"use client";

import Image from "next/image";
import useAuthStore from "@/features/auth/store/useAuthStore";
import { cn, getDisplayName, getInitials } from "../utils";

export function UserAvatar({ className }: { className?: string }) {
  const { user } = useAuthStore();
  if (!user) return null;

  return user.avatar ? (
    <Image
      src={user.avatar}
      alt=""
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-full object-cover ring-1 ring-border", className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-fg",
        className,
      )}
    >
      {getInitials(user)}
    </span>
  );
}

export function UserInfo({ showEmail = true }: { showEmail?: boolean }) {
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
      <UserAvatar />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">
          {getDisplayName(user)}
        </p>
        {showEmail && user.email && (
          <p className="truncate text-xs text-muted">{user.email}</p>
        )}
      </div>
    </div>
  );
}
