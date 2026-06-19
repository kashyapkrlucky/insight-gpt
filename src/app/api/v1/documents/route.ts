import { imageUploadService } from "@/infra/storage/supabase/service";
import { prisma } from "@/infra/db/connect";
import { getUploadedFile } from "@/infra/trigger/client";

export async function GET() {
  try {
    const files = await imageUploadService.listFiles(
      "69f78235741eea4c990c69dd",
    );
    return Response.json({ files });
  } catch {
    return Response.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}
function getStoragePath(url: string) {
  const parts = url.split("/object/public/");

  const [, bucketAndPath] = parts;

  return bucketAndPath.split("/").slice(1).join("/");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const { data } = await imageUploadService.uploadFile(file);
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
        userId: "69f78235741eea4c990c69dd",
      },
    });

    const trigger = await getUploadedFile.trigger({ fileUrl: path });
    return Response.json({ success: true, data, trigger, chat });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
