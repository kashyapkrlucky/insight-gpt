export const APP_NAME = "Insight GPT";
export const APP_DESCRIPTION = "Upload pdf or image and get insights from Selene";
export const APP_URL = "https://insight-gpt.vercel.app";
export const ASSISTANT_NAME = "Selene";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const MAX_TRANSCRIPT_MESSAGES = 12;
export const MAX_MESSAGE_CHARS = 4_000;
export const ACCEPTED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
export const STARTER_PROMPTS = [
  "Summarize the file",
  "List action items",
  "Explain the tricky parts",
  "What should I notice?"
];