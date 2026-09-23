import "server-only";
import { extractText } from "unpdf";
import { ai, EMBEDDING_MODEL } from "@/infra/ai";

export async function parsePdf(buffer: Buffer) {
  const result = await extractText(new Uint8Array(buffer));

  if (Array.isArray(result.text)) {
    return result.text.join("\n\n");
  }

  return result.text;
}

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkDocument(
  text: string,
  metadata: {
    documentId: string;
    userId: string;
  },
) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.createDocuments([text]);

  return chunks.map((chunk, index) => ({
    id: crypto.randomUUID(),

    documentId: metadata.documentId,
    userId: metadata.userId,

    chunkIndex: index,

    content: chunk.pageContent,
  }));
}


// Well under the API's per-request input limits.
const EMBEDDING_BATCH_SIZE = 100;

export async function embedChunks(
  chunks: {
    content: string;
  }[],
) {
  const embeddings: number[][] = [];

  for (let start = 0; start < chunks.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(start, start + EMBEDDING_BATCH_SIZE);
    const response = await ai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map((c) => c.content),
    });
    // The API returns one embedding per input, in input order.
    embeddings.push(
      ...response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding),
    );
  }

  return embeddings;
}
