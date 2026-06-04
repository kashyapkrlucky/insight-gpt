import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES } from "../../../shared/constants";
import { AcceptedMimeType, ChatMessage } from "../../../shared/types";

export type FileKind = "pdf" | "image";

export type FileValidationResult =
  | {
      readonly ok: true;
      readonly kind: FileKind;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

export function isAcceptedMimeType(type: string): type is AcceptedMimeType {
  return ACCEPTED_MIME_TYPES.includes(type as AcceptedMimeType);
}

export function getFileKind(type: AcceptedMimeType): FileKind {
  return type === "application/pdf" ? "pdf" : "image";
}


export function validateUploadFile(file: File): FileValidationResult {
  if (!isAcceptedMimeType(file.type)) {
    return {
      ok: false,
      message: "Upload a PDF, PNG, JPG, WEBP, or GIF file."
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      message: "This file is empty. Choose another file."
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      message: `Keep uploads under ${formatBytes(MAX_UPLOAD_BYTES)}.`
    };
  }

  return {
    ok: true,
    kind: getFileKind(file.type)
  };
}


export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}


export function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: globalThis.crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString()
  };
}
