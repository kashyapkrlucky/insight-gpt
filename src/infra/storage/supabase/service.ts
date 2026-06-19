import { createClient } from "./client";
import { UploadResponse } from "./types";
import {
  SupabaseError,
  FileSizeError,
  FileTypeError,
  logError,
  handleError,
} from "./utils";

const supabase = createClient();

export class ImageUploadService {
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

  async uploadFile(file: File, userId:string): Promise<UploadResponse> {
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

      // Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from(this.bucketName).getPublicUrl(filePath);

      return {
        success: true,
        data: {
          id: data.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
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
}

// Export a singleton instance
export const imageUploadService = new ImageUploadService();
