import { ACCESS_TOKEN_KEY } from "@/features/auth/utils";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { logoutAndRedirectToLogin } from "./internalApi";

export type StreamEvent<TDone> =
  | { type: "delta"; text: string }
  | { type: "done"; message: TDone }
  | { type: "error"; error: string };

const authHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const readErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
  } catch {
    // Not JSON.
  }
  return `Request failed (${response.status})`;
};

/**
 * POST to an NDJSON streaming endpoint under /api and call `onEvent` for each
 * line. Refreshes the session once on 401, like the axios client does.
 * Throws for non-2xx responses before the stream starts.
 */
export async function postStream<TDone>(
  path: string,
  body: unknown,
  {
    onEvent,
    signal,
  }: { onEvent: (event: StreamEvent<TDone>) => void; signal?: AbortSignal },
) {
  const send = () =>
    fetch(`/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
      signal,
    });

  let response = await send();

  if (response.status === 401) {
    try {
      await useAuthStore.getState().getRefreshedTokens();
    } catch (error) {
      logoutAndRedirectToLogin();
      throw error;
    }
    response = await send();
  }

  if (!response.ok || !response.body) {
    throw new Error(await readErrorMessage(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const emitLines = (flush: boolean) => {
    const lines = buffer.split("\n");
    buffer = flush ? "" : (lines.pop() ?? "");
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line) as StreamEvent<TDone>);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    emitLines(false);
  }
  buffer += decoder.decode();
  emitLines(true);
}
