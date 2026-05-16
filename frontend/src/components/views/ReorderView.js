import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { reorderFile, rotatePage, previewUrl, downloadUrl } from "../../api/client";
import FileCard from "../FileCard";
import PreviewImage from "../PreviewImage";
export default function ReorderView({ files, removeFile, thumbnailSize }) {
    const [selectedId, setSelectedId] = useState(null);
    const [order, setOrder] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadId, setDownloadId] = useState(null);
    const [dragIdx, setDragIdx] = useState(null);
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [pageVersions, setPageVersions] = useState({});
    const [filename, setFilename] = useState("");
    const selected = files.find((f) => f.id === selectedId);
    const initOrder = () => {
        if (!selected)
            return;
        setOrder(Array.from({ length: selected.page_count }, (_, i) => i + 1));
        setSelectedPages(new Set());
    };
    if (selected && order.length === 0) {
        initOrder();
    }
    const move = (idx, dir) => {
        const next = [...order];
        const target = idx + dir;
        if (target < 0 || target >= next.length)
            return;
        [next[idx], next[target]] = [next[target], next[idx]];
        setOrder(next);
    };
    const handleDragStart = (idx) => setDragIdx(idx);
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx)
            return;
        const next = [...order];
        [next[dragIdx], next[idx]] = [next[idx], next[dragIdx]];
        setDragIdx(idx);
        setOrder(next);
    };
    const handleDragEnd = () => setDragIdx(null);
    const toggleSelect = (idx) => {
        const next = new Set(selectedPages);
        if (next.has(idx))
            next.delete(idx);
        else
            next.add(idx);
        setSelectedPages(next);
    };
    const deleteSelected = () => {
        setOrder(order.filter((_, idx) => !selectedPages.has(idx)));
        setSelectedPages(new Set());
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
        return `${previewUrl(selectedId, pageNum)}?v=${v}`;
    };
    const handleReorder = async () => {
        if (!selectedId)
            return;
        setLoading(true);
        setDownloadId(null);
        try {
            const result = await reorderFile(selectedId, order);
            setDownloadId(result.download_id);
        }
        catch (e) {
            alert(e instanceof Error ? e.message : "Reorder failed");
        }
        finally {
            setLoading(false);
        }
    };
    if (files.length === 0) {
        return (_jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to reorder its pages." }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Reorder Pages" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to reorder:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f, onRemove: removeFile }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Click thumbnails to select pages, then delete. Drag or use arrows to reorder." }), _jsx("div", { className: "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-96 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg", children: order.map((pageNum, idx) => {
                            const isSelected = selectedPages.has(idx);
                            return (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(idx), onDragOver: (e) => handleDragOver(e, idx), onDragEnd: handleDragEnd, onClick: () => toggleSelect(idx), className: `relative border rounded-lg p-1 cursor-pointer transition-colors ${dragIdx === idx
                                    ? "border-blue-400 opacity-50"
                                    : isSelected
                                        ? "border-blue-500 ring-2 ring-blue-300"
                                        : "border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [_jsx("span", { className: "text-[10px] text-gray-500 dark:text-gray-400 font-medium", children: idx + 1 }), _jsxs("div", { className: "flex gap-0.5", children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); move(idx, -1); }, disabled: idx === 0, className: "text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 disabled:opacity-30", children: "\u25B2" }), _jsx("button", { onClick: (e) => { e.stopPropagation(); move(idx, 1); }, disabled: idx === order.length - 1, className: "text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 disabled:opacity-30", children: "\u25BC" })] })] }), _jsxs("div", { className: "relative", children: [_jsx(PreviewImage, { src: getPreviewSrc(pageNum), alt: `Page ${pageNum}`, size: thumbnailSize }), _jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleRotate(pageNum);
                                                }, className: "absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm transition-colors", title: "Rotate 90\u00B0", children: "\u21BB" })] }), _jsxs("span", { className: "block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5", children: ["p.", pageNum] })] }, pageNum));
                        }) }), _jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4 mb-1", children: "Output filename" }), _jsx("input", { type: "text", value: filename, onChange: (e) => setFilename(e.target.value), placeholder: "reordered.pdf", className: "w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx("button", { onClick: () => { setSelectedId(null); setOrder([]); setSelectedPages(new Set()); }, className: "px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: "Back" }), _jsx("button", { onClick: () => initOrder(), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: "Reset order" }), selectedPages.size > 0 && (_jsxs("button", { onClick: deleteSelected, className: "px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors", children: ["Delete selected (", selectedPages.size, ")"] })), _jsx("button", { onClick: handleReorder, disabled: loading, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: loading ? "Reordering..." : "Apply new order" })] }), downloadId && (_jsxs("div", { className: "mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg", children: [_jsx("p", { className: "text-green-700 dark:text-green-300 text-sm mb-2", children: "Reordering complete!" }), _jsx("a", { href: downloadUrl(downloadId, filename || undefined), download: true, className: "inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors", children: "Download reordered PDF" })] }))] }))] }));
}
