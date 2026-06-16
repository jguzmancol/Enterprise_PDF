import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { rotatePage, reorderFile, previewUrl } from "../../api/client";
import FileCard from "../FileCard";
import PreviewImage from "../PreviewImage";
import FileDropzone from "../FileDropzone";
function RotateView({ files, thumbnailSize, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }, ref) {
    const [selectedId, setSelectedId] = useState(null);
    const [pageVersions, setPageVersions] = useState({});
    const [loading, setLoading] = useState(false);
    const selected = files.find((f) => f.id === selectedId);
    useEffect(() => {
        if (files.length > 0) {
            if (!selectedId || !files.find((f) => f.id === selectedId)) {
                setSelectedId(files[0].id);
            }
        }
    }, [files, selectedId]);
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
    const handleDownload = async () => {
        if (!selectedId || !selected)
            return;
        setLoading(true);
        onTabLoadingChange?.(true);
        onTabDownloadIdChange?.(null);
        try {
            const order = Array.from({ length: selected.page_count }, (_, i) => i + 1);
            const result = await reorderFile(selectedId, order);
            onTabDownloadIdChange?.(result.download_id);
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "Download failed");
        }
        finally {
            setLoading(false);
            onTabLoadingChange?.(false);
        }
    };
    useImperativeHandle(ref, () => ({
        action: handleDownload,
        hasPages: selected != null,
        loading,
    }), [selected, loading, handleDownload]);
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to rotate its pages." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Rotate PDF" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to rotate:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Click the circle on any page to rotate it 90\u00B0 clockwise." }), _jsx("div", { className: "grid gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg", style: { gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize || 80}px, 1fr))` }, children: Array.from({ length: selected.page_count }, (_, i) => i + 1).map((pageNum) => (_jsxs("div", { className: "relative border border-gray-200 dark:border-gray-600 rounded-lg p-1", children: [_jsx("div", { className: "text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-0.5 text-center", children: pageNum }), _jsxs("div", { className: "relative", children: [_jsx(PreviewImage, { src: getPreviewSrc(pageNum), alt: `Page ${pageNum}`, size: thumbnailSize }), _jsx("button", { onClick: () => handleRotate(pageNum), className: "absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm transition-colors", title: "Rotate 90\u00B0", children: "\u21BB" })] })] }, pageNum))) }), _jsx("div", { className: "flex gap-2 mt-4", children: _jsx("button", { onClick: () => { setSelectedId(null); setPageVersions({}); }, className: "px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: "Back" }) })] }))] }));
}
export default forwardRef(RotateView);
