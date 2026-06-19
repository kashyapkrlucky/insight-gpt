import "server-only";
import { ai } from "@/infra/ai";

export async function embedQuery(question: string) {
  const response = await ai.embeddings.create({
    model: (process.env.AI_MODEL_TEXT_SMALL! as string) || "text-embedding-3-small",
    input: question,
  });

  return response.data[0].embedding;
}
