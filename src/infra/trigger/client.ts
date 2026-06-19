import { logger, task } from "@trigger.dev/sdk";
import { imageUploadService } from "../storage/supabase/service";
import { parsePdf, chunkDocument, embedChunks } from "@/infra/trigger/ingestion";
import { prisma } from "../db/connect";
import { saveVectors } from "../vectorDB";

export const getUploadedFile = task({
  id: "get-uploaded-file",
  run: async (payload: { fileUrl: string }, { ctx }) => {
    logger.log("Get uploaded file", { payload, ctx });

    const file = await prisma.document.findFirst({
      where: { url: payload.fileUrl },
    });

    const data = await imageUploadService.downloadFileByUrl(payload.fileUrl);

    const text = await parsePdf(data);

    const chunks = await chunkDocument(text, {
      documentId: file?.id || "test",
      userId: "69f78235741eea4c990c69dd",
    });

    logger.log("Chunks", { chunks });
    
    const embeddings = await embedChunks(chunks);

    await saveVectors(chunks, embeddings);

    // TODO: Implement file retrieval logic
    return {
      message: "Get uploaded file",
      fileUrl: payload.fileUrl,
    };
  },
});
