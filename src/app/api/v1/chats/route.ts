import { prisma } from "@/infra/db/connect";
import { getUserFromHeaders } from "@/features/auth/utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest ) {
  try {
    const userId = await getUserFromHeaders(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const chats = await prisma.chat.findMany({
      where: { userId: userId! },
    });
    return Response.json(chats);
  } catch {
    return Response.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}
