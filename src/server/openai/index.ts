import OpenAI from "openai";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { isAcceptedMimeType } from "@/features/FileChat/utils/files";
import { AI_CONFIG, getOpenAIClient } from "@/server/config";
import { OpenAIResponseError } from "@/server/errors";
import {
  buildTranscript,
  createFileInput,
  extractOutputText,
  getLatestQuestion,
} from "@/server/utils";
import type { ChatRequestMessage } from "@/shared/types";

const FILE_CHAT_INSTRUCTIONS =
  "You are Selene, the friendly AI assistant for Insight GPT. Be clear, accurate, and concise. " +
  "Use the uploaded file as the source of truth. If the file does not show enough evidence, say so. " +
  "A tiny bit of humor is welcome, but the answer must stay useful.";

function toOpenAIResponseError(error: unknown): OpenAIResponseError {
  if (error instanceof OpenAIResponseError) return error;

  if (error instanceof OpenAI.APIError) {
    return new OpenAIResponseError(
      error.message || "OpenAI request failed.",
      error.status,
    );
  }

  if (error instanceof Error) {
    return new OpenAIResponseError(error.message);
  }

  return new OpenAIResponseError("OpenAI request failed.");
}

async function buildFileChatRequest(
  file: File,
  messages: readonly ChatRequestMessage[],
): Promise<ResponseCreateParamsNonStreaming> {
  const latestQuestion = getLatestQuestion(messages);
  if (!latestQuestion) {
    throw new OpenAIResponseError("Ask a question about the uploaded file.");
  }

  return {
    input: [
      {
        role: "user",
        content: [
          await createFileInput(file),
          {
            type: "input_text",
            text:
              `Recent transcript:\n${buildTranscript(messages)}\n\n` +
              `Latest question:\n${latestQuestion}\n\n` +
              "Answer the latest question using the uploaded file.",
          },
        ],
      },
    ],
    instructions: FILE_CHAT_INSTRUCTIONS,
    max_output_tokens: AI_CONFIG.maxOutputTokens,
    model: AI_CONFIG.model,
    temperature: AI_CONFIG.temperature,
  };
}

export async function createFileChatResponse(
  file: File,
  messages: readonly ChatRequestMessage[],
): Promise<string> {
  if (!isAcceptedMimeType(file.type)) {
    throw new OpenAIResponseError("Unsupported file type.");
  }

  try {
    const response = await getOpenAIClient().responses.create(
      await buildFileChatRequest(file, messages),
    );

    return extractOutputText(response);
  } catch (error) {
    throw toOpenAIResponseError(error);
  }
}
