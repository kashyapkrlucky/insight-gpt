import { prisma } from "@/infra/db/connect";
import { withAuth } from "@/shared/lib/api/handler";

export const GET = withAuth(async (_request, { user }) => {
  const chats = await prisma.chat.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { document: { select: { status: true } } },
  });
  return Response.json(chats);
});
