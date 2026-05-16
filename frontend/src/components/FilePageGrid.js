import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { previewUrl } from "../api/client";
import PreviewImage from "./PreviewImage";
const MIN = 80;
const MAX = 300;
const STEP = 20;
function formatSize(bytes) {
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export default function FilePageGrid({ files, onRemove }) {
    const [thumbWidth, setThumbWidth] = useState(180);
    const zoomIn = () => setThumbWidth((w) => Math.min(w + STEP, MAX));
    const zoomOut = () => setThumbWidth((w) => Math.max(w - STEP, MIN));
    const gridStyle = {
        gridTemplateColumns: `repeat(auto-fill, ${thumbWidth}px)`,
        justifyContent: "center",
    };
    if (files.length === 0)
        return null;
    return (_jsx("div", { className: "mt-6 space-y-6", children: files.map((file) => (_jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: file.original_name }), _jsxs("p", { className: "text-xs text-gray-500", children: [file.page_count, " page", file.page_count !== 1 ? "s" : "", "\u00B7 ", formatSize(file.size_bytes)] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: zoomOut, disabled: thumbWidth <= MIN, className: "w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors", title: "Zoom out", children: "\u2212" }), _jsxs("span", { className: "text-xs text-gray-400 w-8 text-center", children: [thumbWidth, "px"] }), _jsx("button", { onClick: zoomIn, disabled: thumbWidth >= MAX, className: "w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors", title: "Zoom in", children: "+" }), onRemove && (_jsx("button", { onClick: () => onRemove(file.id), className: "w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 text-lg leading-none ml-2 transition-colors", title: "Remove", children: "\u00D7" }))] })] }), _jsx("div", { className: "grid gap-2", style: gridStyle, children: Array.from({ length: file.page_count }, (_, i) => i + 1).map((pageNum) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-1", children: [_jsx(PreviewImage, { src: previewUrl(file.id, pageNum), alt: `${file.original_name} - page ${pageNum}`, className: "aspect-[5/7] w-full" }), _jsx("span", { className: "block text-[10px] text-center text-gray-400 mt-0.5", children: pageNum })] }, pageNum))) })] }, file.id))) }));
}
