import { task } from "@trigger.dev/sdk";
import { imageUploadService } from "@/infra/storage/supabase/service";
import { removeVectors } from "@/infra/vectorDB";

export const removeUploadedFile = task({
  id: "remove-uploaded-file",
  run: async (payload: { fileUrl: string; userId: string; documentId: string }) => {
    await imageUploadService.deleteFile(payload.fileUrl);

    await removeVectors(payload.documentId);

    return {
      message: "File removed successfully",
    };
  },
});