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

  async uploadFile(file: File): Promise<UploadResponse> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `/69f78235741eea4c990c69dd/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      console.log(data);
      

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

  async uploadMultipleFiles(files: File[]): Promise<UploadResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
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

  async listFiles(user: string): Promise<{
    success: boolean;
    data?: unknown[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(user);

      if (error) {
        const appError = new SupabaseError(error.message, error);
        logError(appError, "listFiles");
        return {
          success: false,
          error: appError.message,
        };
      }

      return { success: true, data: data as unknown[] };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, "listFiles");

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  async getFileById(id: string): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(id);

      if (error) {
        const appError = new SupabaseError(error.message, error);
        logError(appError, "getFileById");
        return {
          success: false,
          error: appError.message,
        };
      }

      return { success: true, data: data as unknown };
    } catch (error) {
      const appError = handleError(error);
      logError(appError, "getFileById");

      return {
        success: false,
        error: appError.message,
      };
    }
  }

  getPublicUrl(filePath: string): string {
    const {
      data: { publicUrl },
    } = supabase.storage.from(this.bucketName).getPublicUrl(filePath);

    return publicUrl;
  }

  async downloadFileByUrl(path: string): Promise<Buffer> {
    try {
      console.log(path);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(path);

      if (error) {
        console.log(error);

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
