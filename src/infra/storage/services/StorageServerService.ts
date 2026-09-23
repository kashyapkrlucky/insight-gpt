import "server-only";
import { createServerClient } from "../server";
import { handleError, logError, SupabaseError } from "../utils";

const supabase = createServerClient();

export class StorageServerService {
  private bucketName: string;

  constructor() {
    this.bucketName =
      process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || "insight-pdf";
  }

  /** Signed URL the browser can upload one object to, without any storage policy. */
  async createSignedUploadUrl(
    path: string,
  ): Promise<{ path: string; token: string }> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUploadUrl(path);

    if (error) {
      const appError = new SupabaseError(error.message, error);
      logError(appError, "createSignedUploadUrl");
      throw appError;
    }

    return { path: data.path, token: data.token };
  }

  /** Metadata for an uploaded object, or null when it does not exist. */
  async getFileInfo(
    path: string,
  ): Promise<{ id: string; size?: number; contentType?: string } | null> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .info(path);

    if (error || !data) {
      return null;
    }

    return { id: data.id, size: data.size, contentType: data.contentType };
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
