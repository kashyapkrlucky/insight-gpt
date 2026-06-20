export interface Chat {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface DocumentInput {
  fileId: string;
  url: string;
  name: string;
  size: number;
  type: string;
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
