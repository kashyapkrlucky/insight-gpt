import { createServerClient } from "../server";
import { handleError, logError, SupabaseError } from "../utils";

const supabase = createServerClient();

export class StorageServerService {
  private bucketName: string;

  constructor() {
    this.bucketName =
      process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || "insight-pdf";
  }

  async downloadFileByUrl(path: string): Promise<Buffer> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(path);

      if (error) {
        const appError = new SupabaseError(error.message, error);
        logError(appError, "downloadFileByUrl");
        throw appError;
      }

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      const appError = handleError(error);
      logError(appError, "downloadFileByUrl");
      throw appError;
    }
  }

  async deleteFile(
    filePath: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        const appError = new SupabaseError(error.message, error);
        logError(appError, "deleteFile");
        return {
          success: false,
          error: appError.message,
        };
      }

      return { success: true };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, "deleteFile");

      return {
        success: false,
        error: appError.message,
      };
    }
  }
}

export const storageServerService = new StorageServerService();
