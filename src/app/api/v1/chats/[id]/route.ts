import { prisma } from "@/infra/db/connect";
import { NextRequest } from "next/server";
import { removeUploadedFile } from "@/jobs/document/removeUploadedFile";
import { getUserFromHeaders } from "@/features/auth/utils";

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

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/v1/chats/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const userId = await getUserFromHeaders(_request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const chat = await prisma.chat.findUnique({
      where: { id },
    });
    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const document = await prisma.document.findUnique({
      where: { id: chat.documentId },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    await removeUploadedFile.trigger({
      fileUrl: document.url,
      userId: userId,
      documentId: document.id,
    });

    await prisma.message.deleteMany({
      where: { chatId: id },
    });

    await prisma.chat.delete({
      where: { id },
    });

    return Response.json("Chat deleted successfully");
  } catch {
    return Response.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}
