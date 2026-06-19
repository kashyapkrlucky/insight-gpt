import { logger, task } from "@trigger.dev/sdk";
import { imageUploadService } from "@/infra/storage/supabase/service";
import {
  parsePdf,
  chunkDocument,
  embedChunks,
} from "@/infra/ingestion";
import { saveVectors } from "@/infra/vectorDB";

export const getUploadedFile = task({
  id: "get-uploaded-file",
  run: async (payload: { fileUrl: string; userId: string; fileId: string }) => {
    const data = await imageUploadService.downloadFileByUrl(payload.fileUrl);

    const text = await parsePdf(data);
    logger.info("Text extracted from PDF", {
      textLength: text.length,
    });
    const chunks = await chunkDocument(text, {
      documentId: payload.fileId,
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
