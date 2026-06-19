import { IUser } from "@/features/auth/types";

export function cn(
  ...classes: readonly (false | null | string | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

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