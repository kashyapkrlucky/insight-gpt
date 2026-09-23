import { NextRequest } from "next/server";

export const USER = { id: "user-1", role: "user" };
export const GUEST = { id: "guest-1", role: "guest" };

export function makeRequest(
  path: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {},
) {
  return new NextRequest(`http://localhost:3001${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}

export const routeContext = <P extends Record<string, string>>(
  params = {} as P,
) => ({ params: Promise.resolve(params) });
