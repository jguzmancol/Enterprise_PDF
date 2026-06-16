import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { reorderFile, rotatePage, previewUrl } from "../../api/client";
import FileCard from "../FileCard";
import PreviewImage from "../PreviewImage";
import FileDropzone from "../FileDropzone";
function ReorderView({ files, removeFile, thumbnailSize, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }, ref) {
    const [selectedId, setSelectedId] = useState(null);
    const [order, setOrder] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [pageVersions, setPageVersions] = useState({});
    const selected = files.find((f) => f.id === selectedId);
    useEffect(() => {
        if (files.length > 0) {
            if (!selectedId || !files.find((f) => f.id === selectedId)) {
                setSelectedId(files[0].id);
            }
        }
    }, [files, selectedId]);
    const initOrder = () => {
        if (!selected)
            return;
        setOrder(Array.from({ length: selected.page_count }, (_, i) => i + 1));
    };
    if (selected && order.length === 0) {
        initOrder();
    }
    const handleDeletePage = (idx) => {
        setOrder(order.filter((_, i) => i !== idx));
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
    const handleRotate = async (pageNum) => {
        if (!selectedId)
            return;
        try {
            await rotatePage(selectedId, pageNum);
            const key = `${selectedId}-${pageNum}`;
            setPageVersions((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
        }
        catch (e) {
            if (onApiError?.(e))
                return;
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
    const handleReorder = async () => {
        if (!selectedId)
            return;
        setLoading(true);
        onTabLoadingChange?.(true);
        onTabDownloadIdChange?.(null);
        try {
            const result = await reorderFile(selectedId, order);
            onTabDownloadIdChange?.(result.download_id);
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "Reorder failed");
        }
        finally {
            setLoading(false);
            onTabLoadingChange?.(false);
        }
    };
    useImperativeHandle(ref, () => ({
        action: handleReorder,
        reset: () => { setSelectedId(null); setOrder([]); },
        hasPages: order.length > 0,
        loading,
    }), [order.length, loading, handleReorder]);
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to reorder its pages." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Reorder Pages" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to reorder:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f, onRemove: removeFile }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Drag to reorder, remove pages you don't want." }), _jsx("div", { className: "grid gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg", style: { gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize || 80}px, 1fr))` }, children: order.map((pageNum, idx) => (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(idx), onDragOver: (e) => handleDragOver(e, idx), onDragEnd: handleDragEnd, className: `relative border rounded-lg p-1 cursor-pointer transition-colors ${dragIdx === idx
                                ? "border-blue-400 opacity-50"
                                : "border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [_jsx("span", { className: "text-[10px] text-gray-500 dark:text-gray-400 font-medium", children: idx + 1 }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleRotate(pageNum);
                                                    }, className: "w-6 h-6 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm transition-colors", title: "Rotate 90\u00B0", children: "\u21BB" }), _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleDeletePage(idx);
                                                    }, className: "w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 border border-red-400 flex items-center justify-center text-xs text-white shadow-sm transition-colors", title: "Remove", children: "\u2715" })] })] }), _jsx(PreviewImage, { src: getPreviewSrc(pageNum), alt: `Page ${pageNum}`, size: thumbnailSize }), _jsxs("span", { className: "block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5", children: ["p.", pageNum] })] }, pageNum))) })] }))] }));
}
export default forwardRef(ReorderView);
