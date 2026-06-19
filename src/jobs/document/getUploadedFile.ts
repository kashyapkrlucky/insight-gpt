import { task } from "@trigger.dev/sdk";
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
    const chunks = await chunkDocument(text, {
      documentId: payload.fileId,
      userId: payload.userId,
    });

    const embeddings = await embedChunks(chunks);

    await saveVectors(chunks, embeddings);

    return {
      message: "File processed successfully",
      fileUrl: payload.fileUrl,
    };
  },
});
