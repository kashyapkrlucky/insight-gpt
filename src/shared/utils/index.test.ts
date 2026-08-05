import { describe, expect, it } from "vitest";
import type { IUser } from "@/features/auth/types";
import {
  asDate,
  clamp,
  cn,
  formatBytes,
  formatDate,
  formatDateWithTime,
  formatRelativeTime,
  getDisplayName,
  getInitials,
  monthYearOnly,
  newId,
} from "./index";

const baseUser: IUser = {
  _id: "user-1",
  id: "user-1",
  name: "",
  email: "",
  username: "",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, undefined, null as unknown as string, "b")).toBe(
      "a b",
    );
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(false, undefined)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a date as 'MMM D, YYYY'", () => {
    expect(formatDate(new Date("2026-03-05T00:00:00.000Z"))).toBe(
      "Mar 5, 2026",
    );
  });
});

describe("formatDateWithTime", () => {
  it("includes hour and minute in the formatted output", () => {
    const result = formatDateWithTime(new Date("2026-03-05T10:30:00.000Z"));
    expect(result).toContain("Mar 5, 2026");
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("monthYearOnly", () => {
  it("formats a date string as 'MMM YYYY'", () => {
    expect(monthYearOnly("2026-03-05T00:00:00.000Z")).toBe("Mar 2026");
  });
});

describe("formatRelativeTime", () => {
  it("returns a relative time string with a suffix", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneHourAgo)).toMatch(/ago$/);
  });
});

describe("newId", () => {
  it("returns a non-empty string", () => {
    expect(typeof newId()).toBe("string");
    expect(newId().length).toBeGreaterThan(0);
  });

  it("returns unique values across calls", () => {
    expect(newId()).not.toBe(newId());
  });
});

describe("asDate", () => {
  it("returns null for falsy input", () => {
    expect(asDate(null)).toBeNull();
    expect(asDate(undefined)).toBeNull();
    expect(asDate("")).toBeNull();
  });

  it("returns the same Date instance when given a Date", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    expect(asDate(date)).toBe(date);
  });

  it("parses a valid date string", () => {
    const result = asDate("2026-01-01T00:00:00.000Z");
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("returns null for an unparsable string", () => {
    expect(asDate("not-a-date")).toBeNull();
  });
});

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to the minimum", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to the maximum", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("getInitials", () => {
  it("derives initials from a multi-word username", () => {
    expect(getInitials({ ...baseUser, username: "Jane Doe" })).toBe("JD");
  });

  it("falls back to the first letter of the email when no username", () => {
    expect(
      getInitials({ ...baseUser, username: "", email: "user@example.com" }),
    ).toBe("U");
  });

  it("falls back to 'U' when neither username nor email is present", () => {
    expect(getInitials({ ...baseUser, username: "", email: "" })).toBe("U");
  });
});

describe("getDisplayName", () => {
  it("prefers name over username and email", () => {
    expect(
      getDisplayName({
        ...baseUser,
        name: "Jane",
        username: "jane99",
        email: "jane@example.com",
      }),
    ).toBe("Jane");
  });

  it("falls back to username when name is missing", () => {
    expect(
      getDisplayName({
        ...baseUser,
        name: "",
        username: "jane99",
        email: "jane@example.com",
      }),
    ).toBe("jane99");
  });

  it("falls back to email when name and username are missing", () => {
    expect(
      getDisplayName({ ...baseUser, name: "", username: "", email: "jane@example.com" }),
    ).toBe("jane@example.com");
  });

  it("falls back to 'User' when nothing is present", () => {
    expect(getDisplayName({ ...baseUser, name: "", username: "", email: "" })).toBe(
      "User",
    );
  });
});

describe("formatBytes", () => {
  it("formats bytes with no decimal precision", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes with one decimal of precision", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1024 * 1024 * 1024 * 3)).toBe("3.0 GB");
  });
});
