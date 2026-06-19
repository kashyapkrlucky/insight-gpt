import { imageUploadService } from "@/infra/storage/supabase/service";
import { prisma } from "@/infra/db/connect";
import { getUploadedFile } from "@/jobs/document/getUploadedFile";
import { getUserFromHeaders } from "@/features/auth/utils";
import { NextRequest } from "next/server";

function getStoragePath(url: string) {
  const parts = url.split("/object/public/");

  const [, bucketAndPath] = parts;

  return bucketAndPath.split("/").slice(1).join("/");
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromHeaders(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const { data } = await imageUploadService.uploadFile(file, userId!);

    if (!data) {
      throw new Error("Failed to upload file");
    }

    const path = getStoragePath(data.url);

    const document = await prisma.document.create({
      data: {
        fileId: data.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: path,
      },
    });

    const chat = await prisma.chat.create({
      data: {
        title: file.name,
        documentId: document.id,
        userId: userId!,
      },
    });

    const trigger = await getUploadedFile.trigger({
      fileUrl: path,
      userId: userId!,
      documentId: document.id,
    });

    return Response.json({ success: true, data, trigger, chat });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
