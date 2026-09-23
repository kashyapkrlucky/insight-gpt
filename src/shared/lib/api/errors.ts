import "server-only";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string) =>
  new ApiError(400, "BAD_REQUEST", message);
export const unauthorized = () =>
  new ApiError(401, "UNAUTHORIZED", "Unauthorized");
export const notFound = (message = "Not found") =>
  new ApiError(404, "NOT_FOUND", message);
export const conflict = (message: string) =>
  new ApiError(409, "CONFLICT", message);
export const upstreamError = (message: string) =>
  new ApiError(502, "UPSTREAM_ERROR", message);

const formatZodError = (error: ZodError) =>
  error.issues
    .map((issue) =>
      issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
    )
    .join("; ");

/**
 * Error body shape: `{ error: string, code: string }`. `error` stays a string
 * so the client's getErrorMessage() can show it directly.
 */
export const toErrorResponse = (error: unknown) => {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status, headers: error.headers },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      { error: formatZodError(error), code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  console.error("Unhandled API error:", error);
  return Response.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
};
