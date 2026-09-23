// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.hoisted(() => vi.fn());
vi.mock("@/infra/ai", () => ({
  ai: { embeddings: { create } },
  EMBEDDING_MODEL: "test-embedding-model",
}));

import { embedChunks } from "./index";

describe("embedChunks", () => {
  beforeEach(() => {
    create.mockReset();
    // Echo each input back as a 1-d "embedding" of its number, out of order,
    // to check results are re-ordered by index.
    create.mockImplementation(async ({ input }: { input: string[] }) => ({
      data: input
        .map((text, index) => ({ index, embedding: [Number(text)] }))
        .reverse(),
    }));
  });

  it("embeds in batches of 100 and keeps chunk order", async () => {
    const chunks = Array.from({ length: 250 }, (_, i) => ({ content: String(i) }));

    const embeddings = await embedChunks(chunks);

    expect(create).toHaveBeenCalledTimes(3);
    expect(create.mock.calls.map(([arg]) => arg.input.length)).toEqual([100, 100, 50]);
    expect(create.mock.calls[0][0].model).toBe("test-embedding-model");
    expect(embeddings.map(([value]) => value)).toEqual(
      Array.from({ length: 250 }, (_, i) => i),
    );
  });

  it("makes no request for zero chunks", async () => {
    expect(await embedChunks([])).toEqual([]);
    expect(create).not.toHaveBeenCalled();
  });
});
