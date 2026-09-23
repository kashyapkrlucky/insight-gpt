import "server-only";

import OpenAI from "openai";

export const ai = new OpenAI({
  apiKey: process.env.AI_API_KEY!,
});

/**
 * One embedding model for both indexing and querying. Vectors from different
 * models aren't comparable, so the two must never drift apart.
 */
export const EMBEDDING_MODEL =
  process.env.AI_MODEL_TEXT_SMALL || "text-embedding-3-small";
