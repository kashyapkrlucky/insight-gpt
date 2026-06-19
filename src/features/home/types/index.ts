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
