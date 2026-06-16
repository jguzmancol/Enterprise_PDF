export interface FileInfo {
  id: string;
  original_name: string;
  page_count: number;
  size_bytes: number;
}

export interface UploadResponse {
  files: FileInfo[];
  ttl_seconds: number;
}

export interface FilePage {
  file_id: string;
  page: number;
}

export interface ResultResponse {
  download_id: string;
  filename: string;
}

export interface TabActions {
  action: () => Promise<void>;
  reset?: () => void;
  loading: boolean;
  hasPages: boolean;
}
