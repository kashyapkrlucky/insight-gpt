import { createClient } from "../client";
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/shared/constants";
import {
  FileSizeError,
  FileTypeError,
  handleError,
  logError,
  SupabaseError,
} from "../utils";

const supabase = createClient();

export class StorageClientService {
  private bucketName: string;

  constructor() {
    this.bucketName =
      process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || "insight-pdf";
  }

  /** Client-side check for fast feedback. The server validates again. */
  validateFile(file: File): void {
    const allowedTypes: readonly string[] = ACCEPTED_MIME_TYPES;
    if (!allowedTypes.includes(file.type)) {
      throw new FileTypeError(file.type, [...allowedTypes]);
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new FileSizeError(MAX_UPLOAD_BYTES, file.size);
    }
  }

  /**
   * Upload to a server-issued signed URL. No storage policies are needed,
   * so the bucket can stay private.
   */
  async uploadToSignedUrl(
    path: string,
    token: string,
    file: File,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type,
        });

      if (error) {
        const appError = new SupabaseError(error.message, error);
        logError(appError, "uploadToSignedUrl");
        return { success: false, error: appError.message };
      }

      return { success: true };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, "uploadToSignedUrl");
      return { success: false, error: appError.message };
    }
  }
}

export const storageClientService = new StorageClientService();
