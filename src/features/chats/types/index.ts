export interface Chat {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  createdAt: Date;
  /** Indexing status of the chat's document, when the API includes it. */
  document?: { status: string };
}

export interface Message {
  id: string;
  chatId: string;
  author: string;
  content: string;
  createdAt: Date | string;
  /** Client-only state for messages that aren't saved yet. */
  status?: "sending" | "streaming" | "failed";
}

export interface FileObject {
  id: string;
  name: string;
  size: number;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
  };
  updated_at: string;
}
