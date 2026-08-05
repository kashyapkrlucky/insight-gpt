
import "server-only";
import type { retrieveChunks } from "./retrieve";

type Chunks = Awaited<ReturnType<typeof retrieveChunks>>;

export function buildContext(chunks: Chunks) {
  return chunks
    .map((chunk, index) => {
      const content = (chunk.payload as Record<string, unknown> | undefined)
        ?.content;

      return `
SOURCE ${index + 1}

${content}

`;
    })
    .join("\n");
}
