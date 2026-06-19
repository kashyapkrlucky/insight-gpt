// Image upload related types
export interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  uploadedAt?: Date;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
  };
  error?: string;
}

// UI Component types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose?: () => void;
}

// Form types
export interface ImageUploadFormProps {
  onUpload: (files: File[]) => Promise<UploadResponse[]>;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
}

// Store types
export interface UploadStore {
  images: ImageFile[];
  isUploading: boolean;
  progress: Record<string, UploadProgress>;
  error: string | null;

  // Actions
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setUploading: (uploading: boolean) => void;
  updateProgress: (id: string, progress: UploadProgress) => void;
  setError: (error: string | null) => void;
}
