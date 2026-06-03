import { ApiError } from "./ApiError";

type ApiFailure = {
  readonly ok: false;
  readonly error: string;
};

export async function CreateRequest<T extends { readonly ok: true }>(
  endpoint: string,
  body: FormData
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    body
  });

  const data = (await response.json()) as T | ApiFailure;

  if (!response.ok || !data.ok) {
    const message = data.ok ? "Request failed." : data.error;
    throw new ApiError(message, response.status);
  }

  return data;
}
