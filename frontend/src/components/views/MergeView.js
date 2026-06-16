import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { mergePages, rotatePage, previewUrl } from "../../api/client";
import PreviewImage from "../PreviewImage";
import FileDropzone from "../FileDropzone";
function MergeView({ files, thumbnailSize, onUpload, error, useSharedFiles, multiple = true, onApiError, onTabLoadingChange, onTabDownloadIdChange }, ref) {
    const [loading, setLoading] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [order, setOrder] = useState(null);
    const [pageVersions, setPageVersions] = useState({});
    const prevFilesKey = useRef("");
    const filesKey = files.map((f) => f.id).join(",");
    useEffect(() => {
        if (prevFilesKey.current && prevFilesKey.current !== filesKey) {
            setOrder(null);
        }
        prevFilesKey.current = filesKey;
    }, [filesKey]);
    const allPages = useMemo(() => {
        const pages = [];
        for (const f of files) {
            for (let p = 1; p <= f.page_count; p++) {
                pages.push({ fileId: f.id, page: p, fileName: f.original_name });
            }
        }
        return pages;
    }, [files]);
    const displayOrder = order ?? allPages.map((_, i) => i);
    const handleMerge = async () => {
        setLoading(true);
        onTabLoadingChange?.(true);
        onTabDownloadIdChange?.(null);
        try {
            const filePages = displayOrder.map((i) => ({
                file_id: allPages[i].fileId,
                page: allPages[i].page,
            }));
            const result = await mergePages(filePages);
            onTabDownloadIdChange?.(result.download_id);
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "Merge failed");
        }
        finally {
            setLoading(false);
            onTabLoadingChange?.(false);
        }
    };
    useImperativeHandle(ref, () => ({
        action: handleMerge,
        reset: () => setOrder(null),
        hasPages: displayOrder.length > 0,
        loading,
    }), [displayOrder.length, loading, handleMerge]);
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: multiple }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload at least one PDF to get started." })] }));
    }
    const handleDeletePage = (idx) => {
        setOrder(displayOrder.filter((_, i) => i !== idx));
    };
    const handleDragStart = (idx) => setDragIdx(idx);
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx)
            return;
        const next = [...displayOrder];
        [next[dragIdx], next[idx]] = [next[idx], next[dragIdx]];
        setDragIdx(idx);
        setOrder(next);
    };
    const handleDragEnd = () => setDragIdx(null);
    const handleRotate = async (fileId, page) => {
        try {
            await rotatePage(fileId, page);
            const key = `${fileId}-${page}`;
            setPageVersions((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "Rotation failed");
        }
    };
    const getPreviewSrc = (fileId, page) => {
        const key = `${fileId}-${page}`;
        const v = pageVersions[key] ?? 0;
        return `${previewUrl(fileId, page, thumbnailSize)}&v=${v}`;
    };
    return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: multiple }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Merge PDFs" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-4", children: "All pages from your uploaded files. Drag to reorder, remove unwanted pages, then merge." }), _jsx("div", { className: "grid gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg", style: { gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize || 80}px, 1fr))` }, children: displayOrder.map((pageIdx, idx) => {
                    const entry = allPages[pageIdx];
                    return (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(idx), onDragOver: (e) => handleDragOver(e, idx), onDragEnd: handleDragEnd, className: `relative border rounded-lg p-1 cursor-pointer transition-colors ${dragIdx === idx
                            ? "border-blue-400 opacity-50"
                            : "border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-0.5", children: [_jsx("span", { className: "text-[10px] text-gray-500 dark:text-gray-400 font-medium", children: idx + 1 }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleRotate(entry.fileId, entry.page);
                                                }, className: "w-6 h-6 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm transition-colors", title: "Rotate 90\u00B0", children: "\u21BB" }), _jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleDeletePage(idx);
                                                }, className: "w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 border border-red-400 flex items-center justify-center text-xs text-white shadow-sm transition-colors", title: "Remove", children: "\u2715" })] })] }), _jsx(PreviewImage, { src: getPreviewSrc(entry.fileId, entry.page), alt: `${entry.fileName} - page ${entry.page}`, size: thumbnailSize }), _jsxs("span", { className: "block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5 truncate", title: `${entry.fileName} p.${entry.page}`, children: [entry.fileName, " p.", entry.page] })] }, `${entry.fileId}-${entry.page}-${idx}`));
                }) })] }));
}
export default forwardRef(MergeView);
