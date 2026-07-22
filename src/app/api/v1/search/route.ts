import { embedQuery } from "@/features/rag/embedQuery";
import { retrieveChunks } from "@/features/rag/retrieve";
import { buildContext } from "@/features/rag/buildContext";
import { NextRequest, NextResponse } from "next/server";
import { generateAnswer } from "@/features/rag/generateAnswer";
import { prisma } from "@/infra/db/connect";
import { getUserFromHeaders } from "@/features/auth/utils";

export async function POST(req: NextRequest) {
  const userId = await getUserFromHeaders(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question, chatId } = await req.json();

  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
  });

  if (!chat || chat.userId !== userId) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  await prisma.message.create({
    data: {
      chatId: chatId,
      author: "user",
      content: question,
    },
  });

  const vector = await embedQuery(question);

  const chunks = await retrieveChunks(vector, chat.documentId, chat.userId);

  const context = buildContext(chunks);

  const answer = await generateAnswer(context, question);

  const message = await prisma.message.create({
    data: {
      chatId: chatId,
      author: "assistant",
      content: answer || "Error in reading document",
    },
  });

  return NextResponse.json(message);
}
