import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { splitFile, rotatePage, previewUrl, downloadUrl } from "../../api/client";
import FileCard from "../FileCard";
import PreviewImage from "../PreviewImage";
import FileDropzone from "../FileDropzone";
export default function SplitView({ files, removeFile, thumbnailSize, onUpload, error, useSharedFiles }) {
    const [selectedId, setSelectedId] = useState(null);
    const [rangesText, setRangesText] = useState("");
    const [filename, setFilename] = useState("");
    const [loading, setLoading] = useState(false);
    const [downloadId, setDownloadId] = useState(null);
    const [resultFilename, setResultFilename] = useState("");
    const [pageVersions, setPageVersions] = useState({});
    const selected = files.find((f) => f.id === selectedId);
    const appendToRanges = (page) => {
        const current = rangesText.trim();
        if (!current) {
            setRangesText(String(page));
        }
        else {
            const parts = current.split(",").map((s) => s.trim()).filter(Boolean);
            const last = parts[parts.length - 1];
            const rangeMatch = last.match(/^(\d+)-(\d+)$/);
            if (rangeMatch) {
                const rangeStart = parseInt(rangeMatch[1]);
                const rangeEnd = parseInt(rangeMatch[2]);
                if (page === rangeEnd + 1) {
                    parts[parts.length - 1] = `${rangeStart}-${page}`;
                    setRangesText(parts.join(", "));
                    return;
                }
            }
            parts.push(String(page));
            setRangesText(parts.join(", "));
        }
    };
    const handleRotate = async (pageNum) => {
        if (!selectedId)
            return;
        try {
            await rotatePage(selectedId, pageNum);
            const key = `${selectedId}-${pageNum}`;
            setPageVersions((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
        }
        catch (e) {
            alert(e instanceof Error ? e.message : "Rotation failed");
        }
    };
    const getPreviewSrc = (pageNum) => {
        if (!selectedId)
            return "";
        const key = `${selectedId}-${pageNum}`;
        const v = pageVersions[key] ?? 0;
        return `${previewUrl(selectedId, pageNum, thumbnailSize)}&v=${v}`;
    };
    const handleSplit = async () => {
        if (!selectedId)
            return;
        const ranges = rangesText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((part) => {
            const m = part.match(/^(\d+)-(\d+)$/);
            if (m)
                return [parseInt(m[1]), parseInt(m[2])];
            const n = parseInt(part);
            if (!isNaN(n))
                return [n, n];
            return null;
        })
            .filter(Boolean);
        if (ranges.length === 0) {
            alert("Enter at least one page range (e.g. 1-3, 5, 7-9)");
            return;
        }
        setLoading(true);
        setDownloadId(null);
        setResultFilename("");
        try {
            const result = await splitFile(selectedId, ranges, filename || undefined);
            setDownloadId(result.download_id);
            setResultFilename(result.filename);
        }
        catch (e) {
            alert(e instanceof Error ? e.message : "Split failed");
        }
        finally {
            setLoading(false);
        }
    };
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to split it into parts." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Split PDF" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to split:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f, onRemove: removeFile }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, onRemove: removeFile, selected: true }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Click thumbnails to add pages, or type ranges manually." }), _jsx("div", { className: "grid gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg mb-4", style: { gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize || 80}px, 1fr))` }, children: Array.from({ length: selected.page_count }, (_, i) => i + 1).map((pageNum) => (_jsxs("button", { onClick: () => appendToRanges(pageNum), className: "border border-gray-200 dark:border-gray-600 rounded-lg p-1 hover:border-blue-300 transition-colors", children: [_jsxs("div", { className: "relative", children: [_jsx(PreviewImage, { src: getPreviewSrc(pageNum), alt: `Page ${pageNum}`, size: thumbnailSize }), _jsx("span", { onClick: (e) => {
                                                e.stopPropagation();
                                                handleRotate(pageNum);
                                            }, className: "absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm cursor-pointer transition-colors", title: "Rotate 90\u00B0", children: "\u21BB" })] }), _jsx("span", { className: "block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5", children: pageNum })] }, pageNum))) }), _jsxs("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1", children: ["Page ranges (e.g. ", _jsx("code", { className: "dark:text-gray-200", children: "1-3, 5, 7-9" }), ")"] }), _jsx("input", { type: "text", value: rangesText, onChange: (e) => setRangesText(e.target.value), placeholder: "1-3, 5, 7-9", className: "w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" }), _jsxs("p", { className: "text-xs text-gray-400 dark:text-gray-500 mt-1", children: ["Max page: ", selected.page_count] }), _jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 mt-4", children: "Output filename" }), _jsx("input", { type: "text", value: filename, onChange: (e) => setFilename(e.target.value), placeholder: "split.pdf", className: "w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx("button", { onClick: () => { setSelectedId(null); setRangesText(""); setFilename(""); }, className: "px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: "Back" }), _jsx("button", { onClick: handleSplit, disabled: loading, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: loading ? "Splitting..." : "Split" })] }), downloadId && (_jsxs("div", { className: "mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg", children: [_jsx("p", { className: "text-green-700 dark:text-green-300 text-sm mb-2", children: "Split complete!" }), _jsx("a", { href: downloadUrl(downloadId, resultFilename || undefined), className: "inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors", children: "Download result" })] }))] }))] }));
}
