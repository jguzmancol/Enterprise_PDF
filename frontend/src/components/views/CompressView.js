import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { compressFile, downloadUrl } from "../../api/client";
import FileCard from "../FileCard";
import FileDropzone from "../FileDropzone";
const levels = [
    { value: 0, label: "Minimal", desc: "Fast, minor reduction" },
    { value: 1, label: "Light", desc: "Basic compression" },
    { value: 2, label: "Medium", desc: "Good balance" },
    { value: 3, label: "Maximum", desc: "Strongest compression" },
];
export default function CompressView({ files, onUpload, error, useSharedFiles }) {
    const [selectedId, setSelectedId] = useState(null);
    const [level, setLevel] = useState(2);
    const [loading, setLoading] = useState(false);
    const [downloadId, setDownloadId] = useState(null);
    const [filename, setFilename] = useState("");
    const selected = files.find((f) => f.id === selectedId);
    const handleCompress = async () => {
        if (!selectedId)
            return;
        setLoading(true);
        setDownloadId(null);
        try {
            const result = await compressFile(selectedId, level);
            setDownloadId(result.download_id);
        }
        catch (e) {
            alert(e instanceof Error ? e.message : "Compression failed");
        }
        finally {
            setLoading(false);
        }
    };
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to compress it." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Compress PDF" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to compress:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3", children: "Compression level" }), _jsx("div", { className: "flex gap-2", children: levels.map((l) => (_jsxs("button", { onClick: () => setLevel(l.value), className: `flex-1 p-3 border rounded-lg text-center transition-colors ${level === l.value
                                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-100 dark:ring-blue-900/50"
                                : "border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500"}`, children: [_jsx("span", { className: "block text-sm font-medium", children: l.label }), _jsx("span", { className: "block text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: l.desc })] }, l.value))) }), _jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4 mb-1", children: "Output filename" }), _jsx("input", { type: "text", value: filename, onChange: (e) => setFilename(e.target.value), placeholder: "compressed.pdf", className: "w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx("button", { onClick: () => setSelectedId(null), className: "px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: "Back" }), _jsx("button", { onClick: handleCompress, disabled: loading, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: loading ? "Compressing..." : "Compress" })] }), downloadId && (_jsxs("div", { className: "mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg", children: [_jsx("p", { className: "text-green-700 dark:text-green-300 text-sm mb-2", children: "Compression complete!" }), _jsx("a", { href: downloadUrl(downloadId, filename || undefined), download: true, className: "inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors", children: "Download compressed PDF" })] }))] }))] }));
}
