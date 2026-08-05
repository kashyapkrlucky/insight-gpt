// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/v1/health", () => {
  it("returns a 200 OK response", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });
});
