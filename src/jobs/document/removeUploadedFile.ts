import { task } from "@trigger.dev/sdk";
import { removeVectors } from "@/infra/vectorDB";
import { storageServerService } from "@/infra/storage/services/StorageServerService";

export const removeUploadedFile = task({
  id: "remove-uploaded-file",
  run: async (payload: { fileUrl: string; userId: string; documentId: string }) => {
    await storageServerService.deleteFile(payload.fileUrl);

    await removeVectors(payload.documentId);

    return {
      message: "File removed successfully",
    };
  },
});