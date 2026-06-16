import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { compressFile } from "../../api/client";
import FileCard from "../FileCard";
import FileDropzone from "../FileDropzone";
function CompressView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }, ref) {
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [level, setLevel] = useState(2);
    const selected = files.find((f) => f.id === selectedId);
    useEffect(() => {
        if (files.length > 0) {
            if (!selectedId || !files.find((f) => f.id === selectedId)) {
                setSelectedId(files[0].id);
            }
        }
    }, [files, selectedId]);
    const handleCompress = async () => {
        if (!selectedId)
            return;
        setLoading(true);
        onTabLoadingChange?.(true);
        onTabDownloadIdChange?.(null);
        try {
            const result = await compressFile(selectedId, level);
            onTabDownloadIdChange?.(result.download_id);
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "Compression failed");
        }
        finally {
            setLoading(false);
            onTabLoadingChange?.(false);
        }
    };
    useImperativeHandle(ref, () => ({
        action: handleCompress,
        reset: () => setSelectedId(null),
        hasPages: selected != null,
        loading,
    }), [selected, loading, handleCompress]);
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to compress it." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Compress PDF" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to compress:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Compression:" }), [
                                { v: 0, label: "Min" },
                                { v: 1, label: "Light" },
                                { v: 2, label: "Med" },
                                { v: 3, label: "Max" },
                            ].map((l) => (_jsx("button", { onClick: () => setLevel(l.v), className: `px-3 py-1 text-sm rounded border transition-colors ${level === l.v
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: l.label }, l.v)))] })] }))] }));
}
export default forwardRef(CompressView);
