import { prisma } from "@/infra/db/connect";
import { getUserFromHeaders } from "@/features/auth/utils";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/chats/[id]/messages">,
) {
  try {
    const userId = await getUserFromHeaders(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    const chat = await prisma.chat.findUnique({ where: { id } });
    if (!chat || chat.userId !== userId) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId: id },
    });
    return Response.json(messages);
  } catch {
    return Response.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}
