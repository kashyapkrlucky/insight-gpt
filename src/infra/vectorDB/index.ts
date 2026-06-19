import "server-only";
import { QdrantClient } from "@qdrant/js-client-rest";

export const vectorDB = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

type Chunk = {
  id: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  content: string;
};

export async function saveVectors(chunks: Chunk[], embeddings: number[][]) {
  const points = chunks.map((chunk, index) => {
    return {
      id: chunk.id,

      vector: embeddings[index],

      payload: {
        userId: chunk.userId,

        documentId: chunk.documentId,

        chunkIndex: chunk.chunkIndex,

        content: chunk.content,
      },
    };
  });

  console.log("Points to be saved:", points.length);

  await vectorDB.upsert("insight-pdf", {
    wait: true,
    points,
  });
}
