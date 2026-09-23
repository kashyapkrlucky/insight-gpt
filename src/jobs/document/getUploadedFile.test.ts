// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateMany: vi.fn(),
  download: vi.fn(),
  parsePdf: vi.fn(),
  chunkDocument: vi.fn(),
  embedChunks: vi.fn(),
  saveVectors: vi.fn(),
  removeVectors: vi.fn(),
}));

// Capture the task definition so run/onFailure can be called directly.
vi.mock("@trigger.dev/sdk", async () => {
  class AbortTaskRunError extends Error {}
  return {
    AbortTaskRunError,
    logger: { info: vi.fn(), error: vi.fn() },
    task: (definition: unknown) => definition,
  };
});
vi.mock("@/infra/db/connect", () => ({
  prisma: { document: { updateMany: mocks.updateMany } },
}));
vi.mock("@/infra/storage/services/StorageServerService", () => ({
  storageServerService: { downloadFileByUrl: mocks.download },
}));
vi.mock("@/infra/ingestion", () => ({
  parsePdf: mocks.parsePdf,
  chunkDocument: mocks.chunkDocument,
  embedChunks: mocks.embedChunks,
}));
vi.mock("@/infra/vectorDB", () => ({
  saveVectors: mocks.saveVectors,
  removeVectors: mocks.removeVectors,
}));

import { AbortTaskRunError } from "@trigger.dev/sdk";
import { getUploadedFile } from "./getUploadedFile";
import { NO_TEXT_IN_PDF_MESSAGE } from "@/shared/constants";

type TaskDefinition = {
  run: (payload: unknown) => Promise<unknown>;
  onFailure: (params: { payload: unknown; error: unknown }) => Promise<void>;
};
const job = getUploadedFile as unknown as TaskDefinition;

const payload = { fileUrl: "u/f.pdf", userId: "u", documentId: "doc-1" };
const statuses = () => mocks.updateMany.mock.calls.map(([arg]) => arg.data.status);

describe("get-uploaded-file task", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.download.mockResolvedValue(Buffer.from("%PDF"));
    mocks.parsePdf.mockResolvedValue("Some real text");
    mocks.chunkDocument.mockResolvedValue([{ id: "c1", content: "Some real text" }]);
    mocks.embedChunks.mockResolvedValue([[0.1]]);
  });

  it("indexes the document and marks it processing, then ready", async () => {
    const result = await job.run(payload);

    expect(statuses()).toEqual(["processing", "ready"]);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      data: { status: "ready" },
    });
    expect(mocks.saveVectors).toHaveBeenCalled();
    expect(result).toMatchObject({ chunkCount: 1 });
  });

  it("clears old vectors before saving, so retries don't duplicate", async () => {
    await job.run(payload);
    expect(mocks.removeVectors).toHaveBeenCalledWith("doc-1");
    expect(mocks.removeVectors.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.saveVectors.mock.invocationCallOrder[0],
    );
  });

  it.each([[""], ["   \n\n  "]])(
    "aborts without retrying when the PDF has no text (%j)",
    async (text) => {
      mocks.parsePdf.mockResolvedValue(text);

      const error = (await job.run(payload).catch((e: unknown) => e)) as Error;

      expect(error).toBeInstanceOf(AbortTaskRunError);
      expect(error.message).toBe(NO_TEXT_IN_PDF_MESSAGE);
      expect(mocks.embedChunks).not.toHaveBeenCalled();
      expect(mocks.saveVectors).not.toHaveBeenCalled();
    },
  );

  it("onFailure marks the document failed", async () => {
    await job.onFailure({ payload, error: new Error("boom") });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      data: { status: "failed" },
    });
  });
});
