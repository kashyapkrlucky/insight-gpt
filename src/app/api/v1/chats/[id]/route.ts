import { prisma } from "@/infra/db/connect";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/v1/chats/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const chat = await prisma.chat.findUnique({
      where: { id },
    });

    return Response.json(chat);
  } catch {
    return Response.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}
