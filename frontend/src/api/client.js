const BASE = "/api";
export async function uploadFiles(files) {
    const form = new FormData();
    for (const f of files)
        form.append("files", f);
    const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
export function previewUrl(fileId, page) {
    return `${BASE}/preview/${fileId}/${page}`;
}
async function post(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
export function mergeFiles(fileIds) {
    return post(`${BASE}/merge`, { file_ids: fileIds });
}
export function splitFile(fileId, ranges, filename) {
    return post(`${BASE}/split`, { file_id: fileId, ranges, filename });
}
export function compressFile(fileId, level) {
    return post(`${BASE}/compress`, { file_id: fileId, level });
}
export function rotatePage(fileId, page) {
    return post(`${BASE}/rotate-page`, {
        file_id: fileId,
        page,
    });
}
export function rotateFile(fileId, pages, angle) {
    return post(`${BASE}/rotate`, {
        file_id: fileId,
        pages,
        angle,
    });
}
export function reorderFile(fileId, order) {
    return post(`${BASE}/reorder`, {
        file_id: fileId,
        order,
    });
}
export async function toPdf(files) {
    const form = new FormData();
    for (const f of files)
        form.append("files", f);
    const res = await fetch(`${BASE}/to-pdf`, { method: "POST", body: form });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
export function mergePages(filePages) {
    return post(`${BASE}/merge-pages`, { file_pages: filePages });
}
export function downloadUrl(downloadId, filename) {
    const base = `${BASE}/download/${downloadId}`;
    if (filename) {
        return `${base}?filename=${encodeURIComponent(filename)}`;
    }
    return base;
}
