import { logger, task } from "@trigger.dev/sdk";
import {
  parsePdf,
  chunkDocument,
  embedChunks,
} from "@/infra/ingestion";
import { saveVectors } from "@/infra/vectorDB";
import { storageServerService } from "@/infra/storage/services/StorageServerService";

export const getUploadedFile = task({
  id: "get-uploaded-file",
  run: async (payload: { fileUrl: string; userId: string; documentId: string }) => {

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

    await saveVectors(chunks, embeddings);

    logger.info("Vectors saved to database");

    return {
      message: "File processed successfully",
      fileUrl: payload.fileUrl,
    };
  },
});
