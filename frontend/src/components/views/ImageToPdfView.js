import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { toPdf, downloadUrl } from "../../api/client";
export default function ImageToPdfView() {
    const [loading, setLoading] = useState(false);
    const [downloadId, setDownloadId] = useState(null);
    const [filename, setFilename] = useState("");
    const [error, setError] = useState(null);
    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0)
            return;
        setLoading(true);
        setDownloadId(null);
        setError(null);
        try {
            const result = await toPdf(files);
            setDownloadId(result.download_id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Conversion failed");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Image to PDF" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-4", children: "Convert one or more images (PNG, JPEG, WebP, BMP, TIFF) to a single PDF. Each image becomes a page." }), _jsxs("label", { className: "block mb-4", children: [_jsx("span", { className: "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2", children: "Select images" }), _jsx("input", { type: "file", accept: "image/*", multiple: true, onChange: handleUpload, className: "block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/40" })] }), error && (_jsx("div", { className: "p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm mb-4", children: error })), _jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1", children: "Output filename" }), _jsx("input", { type: "text", value: filename, onChange: (e) => setFilename(e.target.value), placeholder: "converted.pdf", className: "w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" }), loading && (_jsx("p", { className: "text-sm text-blue-600 mt-3", children: "Converting..." })), downloadId && (_jsxs("div", { className: "mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg", children: [_jsx("p", { className: "text-green-700 dark:text-green-300 text-sm mb-2", children: "Conversion complete!" }), _jsx("a", { href: downloadUrl(downloadId, filename || undefined), download: true, className: "inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors", children: "Download PDF" })] }))] }));
}
