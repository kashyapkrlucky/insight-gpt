import type { Chat } from "../types";

export type ChatGroup = { label: string; chats: Chat[] };

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const DAY = 24 * 60 * 60 * 1000;

/**
 * Groups chats into Today / Yesterday / Previous 7 days / Previous 30 days /
 * Older, newest first, dropping empty groups.
 */
export function groupChatsByDate(chats: Chat[], now = new Date()): ChatGroup[] {
  const today = startOfDay(now);
  const groups: ChatGroup[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Previous 7 days", chats: [] },
    { label: "Previous 30 days", chats: [] },
    { label: "Older", chats: [] },
  ];

  const sorted = [...chats].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  for (const chat of sorted) {
    const day = startOfDay(new Date(chat.createdAt));
    const index =
      day >= today
        ? 0
        : day >= today - DAY
          ? 1
          : day >= today - 7 * DAY
            ? 2
            : day >= today - 30 * DAY
              ? 3
              : 4;
    groups[index].chats.push(chat);
  }

  return groups.filter((group) => group.chats.length > 0);
}

/** "report.pdf" → "report" for display. */
export const displayTitle = (title: string) =>
  title.replace(/\.pdf$/i, "") || "Untitled";
