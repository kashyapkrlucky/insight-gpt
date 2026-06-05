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

export const getAvatarUrl = (user: IUser) => {
  const avatar = user?.avatar?.trim();

  if (avatar) {
    if (
      avatar.startsWith("/") ||
      avatar.startsWith("data:") ||
      avatar.startsWith("blob:")
    ) {
      return avatar;
    }

    try {
      return new URL(avatar).toString();
    } catch {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      const cleanAvatar = avatar.replace(/^\/+/, "");

      if (!apiUrl) {
        return `/${cleanAvatar}`;
      }

      if (cleanAvatar.startsWith("avatars/")) {
        return `${apiUrl}/${cleanAvatar}`;
      }

      return `${apiUrl}/avatars/${cleanAvatar}`;
    }
  }

  return "/circle-user-round.svg";
};
