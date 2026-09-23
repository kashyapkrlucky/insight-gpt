import { prisma } from "@/infra/db/connect";
import { withAuth } from "@/shared/lib/api/handler";
import { notFound } from "@/shared/lib/api/errors";

export const GET = withAuth<{ id: string }>(
  async (_request, { user, params }) => {
    const chat = await prisma.chat.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true },
    });
    if (!chat) throw notFound("Chat not found");

    const messages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(messages);
  },
);
