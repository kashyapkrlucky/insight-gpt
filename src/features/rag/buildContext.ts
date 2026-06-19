
import "server-only";

export function buildContext(chunks: any[]) {
  return chunks
    .map((chunk, index) => {
      return `
SOURCE ${index + 1}

${chunk.payload.content}

`;
    })
    .join("\n");
}
