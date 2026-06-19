import { prisma } from "@/infra/db/connect";

export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      where: { userId: "69f78235741eea4c990c69dd" },
    });
    return Response.json(chats);
  } catch {
    return Response.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}
