import { CreateRequest } from "@/shared/lib/HttpClient";
import { ChatMessage, ChatRequestMessage, ChatResponse } from "@/shared/types";

type FileChatSuccess = Extract<ChatResponse, { readonly ok: true }>;

export async function askAboutFile(
  file: File,
  messages: readonly ChatMessage[],
): Promise<string> {
  const payload = new FormData();
  const requestMessages: ChatRequestMessage[] = messages.map(
    ({ role, content }) => ({ role, content }),
  );

  payload.append("file", file);
  payload.append("messages", JSON.stringify(requestMessages));

  const data = await CreateRequest<FileChatSuccess>("/api/v1/chat", payload);
  return data.reply;
}
