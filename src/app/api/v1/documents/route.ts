import { z } from "zod";
import { prisma } from "@/infra/db/connect";
import { getUploadedFile } from "@/jobs/document/getUploadedFile";
import { withAuth, parseJsonBody } from "@/shared/lib/api/handler";
import { badRequest, conflict, upstreamError } from "@/shared/lib/api/errors";
import { MAX_UPLOAD_BYTES } from "@/shared/constants";
import { isUserPdfPath } from "@/infra/storage/paths";
import { storageServerService } from "@/infra/storage/services/StorageServerService";

const documentInputSchema = z.object({
  path: z.string().min(1).max(512),
  name: z.string().trim().min(1).max(255),
});

/**
 * Register an uploaded PDF and start indexing it. The storage path must be
 * one this user was issued by /documents/upload-url, and the object must
 * actually exist, so a caller cannot index another user's file.
 */
export const POST = withAuth(async (request, { user }) => {
  const { path, name } = await parseJsonBody(request, documentInputSchema);

  if (!isUserPdfPath(path, user.id)) {
    throw badRequest("Invalid upload path");
  }

  const file = await storageServerService.getFileInfo(path);
  if (!file) {
    throw badRequest("Upload not found. Please upload the file again.");
  }

  if (file.contentType && file.contentType !== "application/pdf") {
    await storageServerService.deleteFile(path);
    throw badRequest("Only PDF files are supported");
  }

  const size = file.size ?? 0;
  if (size > MAX_UPLOAD_BYTES) {
    await storageServerService.deleteFile(path);
    throw badRequest("File is too large");
  }

  const existing = await prisma.document.findFirst({
    where: { url: path },
    select: { id: true },
  });
  if (existing) {
    throw conflict("This upload has already been registered");
  }

  const { document, chat } = await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        fileId: file.id,
        userId: user.id,
        name,
        size,
        type: "application/pdf",
        url: path,
      },
    });
    const chat = await tx.chat.create({
      data: { title: name, documentId: document.id, userId: user.id },
    });
    return { document, chat };
  });

  let handle: Awaited<ReturnType<typeof getUploadedFile.trigger>>;
  try {
    handle = await getUploadedFile.trigger({
      fileUrl: path,
      userId: user.id,
      documentId: document.id,
    });
  } catch (error) {
    console.error("Failed to queue document indexing:", error);
    await prisma.document.update({
      where: { id: document.id },
      data: { status: "failed" },
    });
    throw upstreamError("Could not start processing the document");
  }

  return Response.json(
    {
      document,
      chat,
      trigger: { id: handle.id, publicAccessToken: handle.publicAccessToken },
    },
    { status: 201 },
  );
});
