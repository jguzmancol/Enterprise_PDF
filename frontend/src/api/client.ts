import type { FilePage, ResultResponse } from "../types";

const BASE = "/api";

export async function uploadFiles(files: FileList | File[]) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<import("../types").UploadResponse>;
}

export function previewUrl(fileId: string, page: number, width?: number) {
  let url = `${BASE}/preview/${fileId}/${page}`;
  if (width) url += `?w=${width}`;
  return url;
}

async function post<T>(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function mergeFiles(fileIds: string[]) {
  return post<ResultResponse>(`${BASE}/merge`, { file_ids: fileIds });
}

export function splitFile(fileId: string, ranges: number[][], filename?: string) {
  return post<ResultResponse>(`${BASE}/split`, { file_id: fileId, ranges, filename });
}

export function compressFile(fileId: string, level: number) {
  return post<ResultResponse>(`${BASE}/compress`, { file_id: fileId, level });
}

export function rotatePage(fileId: string, page: number) {
  return post<{success: boolean}>(`${BASE}/rotate-page`, {
    file_id: fileId,
    page,
  });
}

export function rotateFile(fileId: string, pages: number[], angle: number) {
  return post<ResultResponse>(`${BASE}/rotate`, {
    file_id: fileId,
    pages,
    angle,
  });
}

export function reorderFile(fileId: string, order: number[]) {
  return post<ResultResponse>(`${BASE}/reorder`, {
    file_id: fileId,
    order,
  });
}

export async function toPdf(files: FileList | File[]) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await fetch(`${BASE}/to-pdf`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<ResultResponse>;
}

export function mergePages(filePages: FilePage[]) {
  return post<ResultResponse>(`${BASE}/merge-pages`, { file_pages: filePages });
}

export function downloadUrl(downloadId: string, filename?: string) {
  const base = `${BASE}/download/${downloadId}`;
  if (filename) {
    return `${base}?filename=${encodeURIComponent(filename)}`;
  }
  return base;
}
