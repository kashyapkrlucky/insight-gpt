import { DocumentInput } from "@/features/chats/types";


export interface UploadResponse {
  success: boolean;
  data?: DocumentInput;
  error?: string;
}