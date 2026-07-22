import { prisma } from "@/infra/db/connect";
import { NextRequest } from "next/server";
import { removeUploadedFile } from "@/jobs/document/removeUploadedFile";
import { getUserFromHeaders } from "@/features/auth/utils";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/chats/[id]">,
) {
  try {
    const userId = await getUserFromHeaders(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const chat = await prisma.chat.findUnique({
      where: { id },
    });

    if (!chat || chat.userId !== userId) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json(chat);
  } catch {
    return Response.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/chats/[id]">,
) {
  try {
    const userId = await getUserFromHeaders(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const chat = await prisma.chat.findUnique({
      where: { id },
    });
    if (!chat || chat.userId !== userId) {
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

    // messages cascade-delete with the chat at the DB level
    await prisma.chat.delete({ where: { id } });

    return Response.json("Chat deleted successfully");
  } catch {
    return Response.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}
