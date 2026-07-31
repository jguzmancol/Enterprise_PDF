import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { pdfToImages } from "../../api/client";
import FileCard from "../FileCard";
import FileDropzone from "../FileDropzone";
function PdfToImageView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }, ref) {
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [format, setFormat] = useState("png");
    const [dpi, setDpi] = useState(150);
    const selected = files.find((f) => f.id === selectedId);
    useEffect(() => {
        if (files.length > 0) {
            if (!selectedId || !files.find((f) => f.id === selectedId)) {
                setSelectedId(files[0].id);
            }
        }
    }, [files, selectedId]);
    const handleConvert = async () => {
        if (!selectedId)
            return;
        setLoading(true);
        onTabLoadingChange?.(true);
        onTabDownloadIdChange?.(null);
        try {
            const result = await pdfToImages(selectedId, format, dpi);
            onTabDownloadIdChange?.(result.download_id);
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "PDF to image failed");
        }
        finally {
            setLoading(false);
            onTabLoadingChange?.(false);
        }
    };
    useImperativeHandle(ref, () => ({
        action: handleConvert,
        reset: () => setSelectedId(null),
        hasPages: selected != null,
        loading,
    }), [selected, loading, handleConvert]);
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to convert its pages to images (downloads a ZIP)." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "PDF to Image" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to convert:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Format:" }), _jsx("button", { onClick: () => setFormat("png"), className: `px-4 py-2 text-sm rounded-lg border transition-colors ${format === "png"
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: "PNG" }), _jsx("button", { onClick: () => setFormat("jpg"), className: `px-4 py-2 text-sm rounded-lg border transition-colors ${format === "jpg"
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: "JPG" })] }), _jsxs("div", { className: "flex items-center gap-3 max-w-md", children: [_jsx("label", { className: "text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0", children: "DPI" }), _jsx("input", { type: "range", min: "50", max: "400", step: "10", value: dpi, onChange: (e) => setDpi(Number(e.target.value)), className: "flex-1 accent-blue-600" }), _jsx("span", { className: "text-sm font-mono w-12 text-right", children: dpi })] })] }))] }));
}
export default forwardRef(PdfToImageView);
