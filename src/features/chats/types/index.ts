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