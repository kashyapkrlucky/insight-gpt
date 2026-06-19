import "server-only";

import { vectorDB } from "@/infra/vectorDB";

export async function retrieveChunks(
  vector: number[],
  documentId: string,
  userId: string,
) {
  const result = await vectorDB.search("insight-pdf", {
    vector,

    limit: 5,
    filter: {
      must: [
        {
          key: "userId",
          match: {
            value: userId,
          },
        },

        {
          key: "documentId",
          match: {
            value: documentId,
          },
        },
      ],
    },
  });

  return result;
}
