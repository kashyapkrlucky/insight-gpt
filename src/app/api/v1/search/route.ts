import { z } from "zod";
import { embedQuery } from "@/features/rag/embedQuery";
import { retrieveChunks } from "@/features/rag/retrieve";
import { buildContext } from "@/features/rag/buildContext";
import { streamAnswer } from "@/features/rag/generateAnswer";
import { prisma } from "@/infra/db/connect";
import { withAuth, parseJsonBody } from "@/shared/lib/api/handler";
import { conflict, notFound, upstreamError } from "@/shared/lib/api/errors";
import { RATE_LIMITS } from "@/shared/lib/api/rateLimit";
import { MAX_MESSAGE_CHARS } from "@/shared/constants";

const searchSchema = z.object({
  chatId: z.string().min(1).max(64),
  question: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

const ANSWER_FAILED = "Failed to generate an answer. Please try again.";

/**
 * Answers a question about the chat's document.
 *
 * Errors found before generation starts (auth, validation, ownership, rate
 * limit, retrieval) come back as JSON with a status code. After that the
 * response is NDJSON, one event per line:
 *   { "type": "delta", "text": "..." }
 *   { "type": "done", "message": Message }
 *   { "type": "error", "error": "..." }
 */
export const POST = withAuth(
  async (request, { user }) => {
    const { chatId, question } = await parseJsonBody(request, searchSchema);

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: user.id },
      include: { document: { select: { status: true } } },
    });
    if (!chat) throw notFound("Chat not found");

    if (chat.document.status === "failed") {
      throw conflict("This document could not be processed");
    }

    const askedAt = new Date();

    let context: string;
    try {
      const vector = await embedQuery(question);
      const chunks = await retrieveChunks(vector, chat.documentId, user.id);
      context = buildContext(chunks);
    } catch (error) {
      console.error("Retrieval failed:", { chatId, error });
      throw upstreamError(ANSWER_FAILED);
    }

    const encoder = new TextEncoder();

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: object) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
          } catch {
            // The client went away. Nothing left to send to.
          }
        };

        let answer = "";
        try {
          for await (const delta of streamAnswer(
            context,
            question,
            request.signal,
          )) {
            answer += delta;
            send({ type: "delta", text: delta });
          }

          if (!answer.trim()) throw new Error("Empty answer from model");

          // Save the question and answer together, so a failed generation
          // doesn't leave an unanswered question in the history.
          const [, message] = await prisma.$transaction([
            prisma.message.create({
              data: {
                chatId,
                author: "user",
                content: question,
                createdAt: askedAt,
              },
            }),
            prisma.message.create({
              data: { chatId, author: "assistant", content: answer },
            }),
          ]);

          send({ type: "done", message });
        } catch (error) {
          if (!request.signal.aborted) {
            console.error("Answer generation failed:", { chatId, error });
            send({ type: "error", error: ANSWER_FAILED });
          }
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed by a client disconnect.
          }
        }
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  },
  { rateLimit: RATE_LIMITS.search },
);
