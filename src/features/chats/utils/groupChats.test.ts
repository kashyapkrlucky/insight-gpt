import { describe, expect, it } from "vitest";
import { displayTitle, groupChatsByDate } from "./groupChats";
import type { Chat } from "../types";

const chat = (id: string, createdAt: string): Chat => ({
  id,
  documentId: `doc-${id}`,
  userId: "user-1",
  title: `${id}.pdf`,
  createdAt: new Date(createdAt),
});

describe("groupChatsByDate", () => {
  const now = new Date("2026-09-23T15:00:00");

  it("buckets chats by age, newest first, skipping empty groups", () => {
    const groups = groupChatsByDate(
      [
        chat("older", "2026-06-01T10:00:00"),
        chat("today-early", "2026-09-23T08:00:00"),
        chat("yesterday", "2026-09-22T23:59:00"),
        chat("today-late", "2026-09-23T14:00:00"),
        chat("week", "2026-09-18T10:00:00"),
        chat("month", "2026-09-01T10:00:00"),
      ],
      now,
    );

    expect(groups.map((g) => [g.label, g.chats.map((c) => c.id)])).toEqual([
      ["Today", ["today-late", "today-early"]],
      ["Yesterday", ["yesterday"]],
      ["Previous 7 days", ["week"]],
      ["Previous 30 days", ["month"]],
      ["Older", ["older"]],
    ]);
  });

  it("returns no groups for no chats", () => {
    expect(groupChatsByDate([], now)).toEqual([]);
  });

  it("accepts createdAt as an ISO string from the API", () => {
    const fromApi = {
      ...chat("a", "2026-09-23T09:00:00"),
      createdAt: "2026-09-23T09:00:00" as unknown as Date,
    };
    expect(groupChatsByDate([fromApi], now)[0].label).toBe("Today");
  });
});

describe("displayTitle", () => {
  it("drops the .pdf extension", () => {
    expect(displayTitle("Report Q3.PDF")).toBe("Report Q3");
    expect(displayTitle("notes")).toBe("notes");
    expect(displayTitle(".pdf")).toBe("Untitled");
  });
});
