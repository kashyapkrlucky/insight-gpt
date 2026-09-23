import "server-only";

import { vectorDB } from "@/infra/vectorDB";

export async function retrieveChunks(
  vector: number[],
  documentId: string,
  userId: string,
) {
  const { points } = await vectorDB.query("insight-pdf", {
    query: vector,
    limit: 5,
    with_payload: true,
    filter: {
      must: [
        { key: "userId", match: { value: userId } },
        { key: "documentId", match: { value: documentId } },
      ],
    },
  });

  return points;
}
