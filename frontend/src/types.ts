export interface FileInfo {
  id: string;
  original_name: string;
  page_count: number;
  size_bytes: number;
}

export interface UploadResponse {
  files: FileInfo[];
}

export interface FilePage {
  file_id: string;
  page: number;
}

export interface ResultResponse {
  download_id: string;
  filename: string;
}
