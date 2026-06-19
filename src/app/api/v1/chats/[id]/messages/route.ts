import { prisma } from "@/infra/db/connect";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/v1/chats/[id]/messages">,
) {
  try {
    const { id } = await ctx.params;

    const messages = await prisma.message.findMany({
      where: { chatId: id },
    });
    return Response.json(messages);
  } catch {
    return Response.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}
