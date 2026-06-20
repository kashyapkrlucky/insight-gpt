// import { imageUploadService } from "@/infra/storage/supabase/service";
import { prisma } from "@/infra/db/connect";
import { getUploadedFile } from "@/jobs/document/getUploadedFile";
import { getUserFromHeaders } from "@/features/auth/utils";
import { NextRequest } from "next/server";
import { z } from "zod";

// function getStoragePath(url: string) {
//   const parts = url.split("/object/public/");

//   const [, bucketAndPath] = parts;

//   return bucketAndPath.split("/").slice(1).join("/");
// }

const documentInputSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromHeaders(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // const formData = await request.formData();
    // const file = formData.get("file") as File;
    // const { data } = await imageUploadService.uploadFile(file, userId!);

    // if (!data) {
    //   throw new Error("Failed to upload file");
    // }

    // const path = getStoragePath(data.url);

    const body = await request.json();
    const validatedData = documentInputSchema.parse(body);

    const document = await prisma.document.create({
      data: {
        fileId: validatedData.fileId,
        name: validatedData.name,
        size: validatedData.size,
        type: validatedData.type,
        url: validatedData.url,
      },
    });

    const chat = await prisma.chat.create({
      data: {
        title: validatedData.name,
        documentId: document.id,
        userId: userId!,
      },
    });

    const trigger = await getUploadedFile.trigger({
      fileUrl: validatedData.url,
      userId: userId!,
      documentId: document.id,
    });

    return Response.json({ success: true, data: validatedData, trigger, chat });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
