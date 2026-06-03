import { ACCEPTED_MIME_TYPES } from "../constants";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly createdAt: string;
};


export type ChatRequestMessage = Pick<ChatMessage, "role" | "content">;

export type ChatResponse =
  | {
      readonly ok: true;
      readonly reply: string;
    }
  | {
      readonly ok: false;
      readonly error: string;
    };

export type UploadedFileSummary = {
  readonly name: string;
  readonly type: string;
  readonly size: number;
};

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];