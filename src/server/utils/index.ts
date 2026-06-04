import { MAX_MESSAGE_CHARS, MAX_TRANSCRIPT_MESSAGES } from "@/shared/constants";
import { ChatRequestMessage } from "@/shared/types";
import type {
  Response,
  ResponseInputFile,
  ResponseInputImage,
  ResponseOutputText,
} from "openai/resources/responses/responses";
import { OpenAIResponseError } from "../errors";

export function buildTranscript(
  messages: readonly ChatRequestMessage[],
): string {
  return messages
    .slice(-MAX_TRANSCRIPT_MESSAGES)
    .map(
      (message) =>
        `${message.role.toUpperCase()}: ${message.content.slice(0, MAX_MESSAGE_CHARS)}`,
    )
    .join("\n\n");
}

export function getLatestQuestion(
  messages: readonly ChatRequestMessage[],
): string | null {
  const latest = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const content = latest?.content.trim();
  return content ? content.slice(0, MAX_MESSAGE_CHARS) : null;
}

export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

export async function createFileInput(
  file: File,
): Promise<ResponseInputFile | ResponseInputImage> {
  const base64File = await fileToBase64(file);

  if (file.type === "application/pdf") {
    return {
      type: "input_file",
      filename: file.name || "uploaded.pdf",
      file_data: `data:application/pdf;base64,${base64File}`,
    };
  }

  return {
    type: "input_image",
    image_url: `data:${file.type};base64,${base64File}`,
    detail: "auto",
  };
}

export function extractOutputText(data: Response): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const text = data.output
    ?.filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((item): item is ResponseOutputText => item.type === "output_text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new OpenAIResponseError("The model returned an empty response.");
  }

  return text;
}

export function isChatRequestMessage(value: unknown): value is ChatRequestMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<Record<keyof ChatRequestMessage, unknown>>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0 &&
    candidate.content.length <= MAX_MESSAGE_CHARS
  );
}
