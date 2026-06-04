import { NextRequest } from "next/server";
import { ChatRequestMessage } from "@/shared/types";
import { validateUploadFile } from "@/features/FileChat/utils/files";
import { MAX_TRANSCRIPT_MESSAGES } from "@/shared/constants";
import { JSONResponse } from "@/server/responses";
import { isChatRequestMessage } from "@/server/utils";
import { ChatRequestParseError, OpenAIResponseError } from "@/server/errors";
import { createFileChatResponse } from "@/server/openai";

export function parseChatMessages(
  value: FormDataEntryValue | null,
): ChatRequestMessage[] {
  if (typeof value !== "string") {
    throw new ChatRequestParseError("Chat messages are required.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    throw new ChatRequestParseError("Chat messages must be valid JSON.");
  }

  if (!Array.isArray(parsed) || !parsed.every(isChatRequestMessage)) {
    throw new ChatRequestParseError("Chat messages are invalid.");
  }

  return parsed.slice(-MAX_TRANSCRIPT_MESSAGES);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    if (!(uploadedFile instanceof File)) {
      return JSONResponse(
        { ok: false, error: "Upload a PDF or image before chatting." },
        400,
      );
    }

    const validation = validateUploadFile(uploadedFile);
    if (!validation.ok) {
      return JSONResponse({ ok: false, error: validation.message }, 400);
    }
    const messages = parseChatMessages(formData.get("messages"));
    const reply = await createFileChatResponse(uploadedFile, messages);
    return JSONResponse({ ok: true, reply });
  } catch (error) {
    if (error instanceof OpenAIResponseError) {
      return JSONResponse(
        { ok: false, error: error.message },
        error.status && error.status >= 400 ? error.status : 502,
      );
    }

    if (error instanceof ChatRequestParseError) {
      return JSONResponse({ ok: false, error: error.message }, 400);
    }

    return JSONResponse({ ok: false, error: "Unexpected server error." }, 500);
  }
}
