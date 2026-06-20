import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode?: number,
    isOperational: boolean = true,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class UploadError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, "UPLOAD_ERROR", 500);
    this.name = "UploadError";
    if (originalError) {
      this.cause = originalError;
    }
  }
}

export class NetworkError extends AppError {
  constructor(message: string = "Network connection failed") {
    super(message, "NETWORK_ERROR", 0);
    this.name = "NetworkError";
  }
}

export class FileSizeError extends ValidationError {
  constructor(maxSize: number, actualSize: number) {
    super(
      `File size ${(actualSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
    );
    this.name = "FileSizeError";
  }
}

export class FileTypeError extends ValidationError {
  constructor(fileType: string, allowedTypes: string[]) {
    super(
      `File type "${fileType}" is not supported. Allowed types: ${allowedTypes.join(", ")}`,
    );
    this.name = "FileTypeError";
  }
}

export class MaxFilesError extends ValidationError {
  constructor(maxFiles: number) {
    super(`Maximum ${maxFiles} files allowed`);
    this.name = "MaxFilesError";
  }
}

export class SupabaseError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, "SUPABASE_ERROR", 500);
    this.name = "SupabaseError";
    if (originalError) {
      this.cause = originalError;
    }
  }
}

// Error handler utility
export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes("Network")) {
      return new NetworkError(error.message);
    }

    if (error.message.includes("Supabase")) {
      return new SupabaseError(error.message, error);
    }

    // Generic error
    return new AppError(error.message, "UNKNOWN_ERROR", 500);
  }

  // Handle non-Error objects
  return new AppError(String(error), "UNKNOWN_ERROR", 500);
};

// Error message formatter for user display
export const formatErrorMessage = (error: AppError): string => {
  switch (error.code) {
    case "VALIDATION_ERROR":
      return `Validation Error: ${error.message}`;
    case "UPLOAD_ERROR":
      return `Upload Failed: ${error.message}`;
    case "NETWORK_ERROR":
      return `Connection Error: ${error.message}`;
    case "FILE_SIZE_ERROR":
      return `File Size Error: ${error.message}`;
    case "FILE_TYPE_ERROR":
      return `File Type Error: ${error.message}`;
    case "MAX_FILES_ERROR":
      return `Limit Error: ${error.message}`;
    case "SUPABASE_ERROR":
      return `Storage Error: ${error.message}`;
    default:
      return `Error: ${error.message}`;
  }
};

// Error logging utility
export const logError = (error: AppError, context?: string) => {
  const logData = {
    code: error.code,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    isOperational: error.isOperational,
  };

  if (error.statusCode && error.statusCode >= 500) {
    console.error("Server Error:", logData);
  } else if (error.statusCode && error.statusCode >= 400) {
    console.warn("Client Error:", logData);
  } else {
    console.info("Application Error:", logData);
  }
};