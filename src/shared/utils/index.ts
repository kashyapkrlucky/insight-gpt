import { formatDistance } from "date-fns";
import { IUser } from "@/features/auth/types";

export function cn(
  ...classes: readonly (false | null | string | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatDateWithTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const monthYearOnly = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
};

export const formatRelativeTime = (date: string) => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const asDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

// Generate initials from user's name or email
export const getInitials = (user: IUser) => {
  if (user && user?.username) {
    return user.username
      .split(" ")
      .map((name: string) => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }
  if (user?.email) {
    return user.email[0].toUpperCase();
  }
  return "U";
};

// Get user display name
export const getDisplayName = (user: IUser) => {
  return user?.name || user?.username || user?.email || "User";
};

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}