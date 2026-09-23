import { prisma } from "@/infra/db/connect";
import { removeUploadedFile } from "@/jobs/document/removeUploadedFile";
import { withAuth } from "@/shared/lib/api/handler";
import { notFound } from "@/shared/lib/api/errors";

type Params = { id: string };

export const GET = withAuth<Params>(async (_request, { user, params }) => {
  const chat = await prisma.chat.findFirst({
    where: { id: params.id, userId: user.id },
    include: { document: { select: { status: true } } },
  });
  if (!chat) throw notFound("Chat not found");

  return Response.json(chat);
});

export const DELETE = withAuth<Params>(async (_request, { user, params }) => {
  const chat = await prisma.chat.findFirst({
    where: { id: params.id, userId: user.id },
    include: { document: true },
  });
  if (!chat) throw notFound("Chat not found");

  const { document } = chat;

  // Deleting the document cascades to its chats and their messages.
  await prisma.document.delete({ where: { id: document.id } });

  // Storage and vector cleanup runs in the background. If queueing fails the
  // DB rows are already gone, so log it rather than failing the request.
  try {
    await removeUploadedFile.trigger({
      fileUrl: document.url,
      userId: user.id,
      documentId: document.id,
    });
  } catch (error) {
    console.error("Failed to queue file cleanup:", {
      documentId: document.id,
      error,
    });
  }

  return Response.json({ id: chat.id });
});
