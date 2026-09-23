import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";
import {
  parsePdf,
  chunkDocument,
  embedChunks,
} from "@/infra/ingestion";
import { removeVectors, saveVectors } from "@/infra/vectorDB";
import { storageServerService } from "@/infra/storage/services/StorageServerService";
import { prisma } from "@/infra/db/connect";
import { NO_TEXT_IN_PDF_MESSAGE } from "@/shared/constants";

type Payload = { fileUrl: string; userId: string; documentId: string };

const setStatus = (documentId: string, status: "processing" | "ready" | "failed") =>
  // updateMany: no error if the document was deleted while indexing.
  prisma.document.updateMany({ where: { id: documentId }, data: { status } });

export const getUploadedFile = task({
  id: "get-uploaded-file",
  run: async (payload: Payload) => {
    await setStatus(payload.documentId, "processing");

    logger.info("Downloading file", {
      fileUrl: payload.fileUrl,
    });
    const data = await storageServerService.downloadFileByUrl(payload.fileUrl);

    logger.info("File downloaded", {
      fileUrl: payload.fileUrl,
    });

    const text = await parsePdf(data);
    logger.info("Text extracted from PDF", {
      textLength: text.length,
    });

    // Scanned or outlined-text PDFs have nothing to index. Retrying won't
    // change that, so abort instead of failing into a retry.
    if (!text.trim()) {
      throw new AbortTaskRunError(NO_TEXT_IN_PDF_MESSAGE);
    }

    const chunks = await chunkDocument(text, {
      documentId: payload.documentId,
      userId: payload.userId,
    });

    logger.info("Chunks created", {
      chunkCount: chunks.length,
    });

    const embeddings = await embedChunks(chunks);

    logger.info("Embeddings created", {
      embeddingCount: embeddings.length,
    });

    // A retry after a partial failure would otherwise duplicate vectors.
    await removeVectors(payload.documentId);
    await saveVectors(chunks, embeddings);

    logger.info("Vectors saved to database");

    await setStatus(payload.documentId, "ready");

    return {
      message: "File processed successfully",
      fileUrl: payload.fileUrl,
      chunkCount: chunks.length,
    };
  },
  // Runs once retries are exhausted (or after an AbortTaskRunError).
  onFailure: async ({ payload, error }) => {
    logger.error("Document indexing failed", {
      documentId: payload.documentId,
      error: error instanceof Error ? error.message : String(error),
    });
    await setStatus(payload.documentId, "failed");
  },
});
