import "server-only";
import { ai, EMBEDDING_MODEL } from "@/infra/ai";

export async function embedQuery(question: string) {
  const response = await ai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: question,
  });

  return response.data[0].embedding;
}
