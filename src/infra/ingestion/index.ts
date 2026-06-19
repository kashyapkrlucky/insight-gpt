import "server-only";
import { extractText } from "unpdf";
import { ai } from "@/infra/ai";

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


export async function embedChunks(
  chunks: {
    content: string;
  }[],
) {
  const response = await ai.embeddings.create({
    model: "text-embedding-3-small",

    input: chunks.map((c) => c.content),
  });

  return response.data.map((item) => item.embedding);
}
