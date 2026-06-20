import { createClient } from "../client";
import { UploadResponse } from "../types";
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

  private validateFile(file: File): void {
    // Check file type
    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      throw new FileTypeError(file.type, allowedTypes);
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      throw new FileSizeError(maxSize, file.size);
    }
  }

  async uploadFile(file: File, userId: string): Promise<UploadResponse> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (error) {
        const appError = new SupabaseError(error.message, error);
        logError(appError, "uploadFile");
        return {
          success: false,
          error: appError.message,
        };
      }
      return {
        success: true,
        data: {
          fileId: data.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: data.path,
        },
      };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, "uploadFile");

      return {
        success: false,
        error: appError.message,
      };
    }
  }
}

export const storageClientService = new StorageClientService();
