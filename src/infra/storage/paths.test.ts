// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildUserPdfPath, isUserPdfPath } from "./paths";

const USER = "665f1c2e9b1e8a0012345678";
const UUID = "3f2b8c1e-4a5d-4e6f-9a0b-1c2d3e4f5a6b";

describe("storage paths", () => {
  it("builds a path that passes its own ownership check", () => {
    const path = buildUserPdfPath(USER);
    expect(path).toMatch(new RegExp(`^${USER}/`));
    expect(isUserPdfPath(path, USER)).toBe(true);
  });

  it.each([
    ["another user's folder", `someone-else/${UUID}.pdf`],
    ["a leading slash", `/${USER}/${UUID}.pdf`],
    ["path traversal", `${USER}/../victim/${UUID}.pdf`],
    ["a nested folder", `${USER}/sub/${UUID}.pdf`],
    ["an arbitrary file name", `${USER}/report.pdf`],
    ["a non-pdf extension", `${USER}/${UUID}.exe`],
    ["a user-id prefix match", `${USER}x/${UUID}.pdf`],
  ])("rejects %s", (_label, path) => {
    expect(isUserPdfPath(path, USER)).toBe(false);
  });

  it("treats regex characters in the user id literally", () => {
    expect(isUserPdfPath(`abc/${UUID}.pdf`, "a.c")).toBe(false);
  });
});
