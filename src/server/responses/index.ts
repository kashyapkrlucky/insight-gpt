import { NextResponse } from "next/server";
import { ChatResponse } from "@/shared/types";

export function JSONResponse(
  payload: ChatResponse,
  status = 200,
): NextResponse<ChatResponse> {
  return NextResponse.json(payload, { status });
}
