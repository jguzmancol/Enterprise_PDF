import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
export default function FileDropzone({ onUpload, accept = ".pdf", multiple = true, label = multiple
    ? "Drag & drop PDF files here, or click to browse"
    : "Drag & drop a PDF file here, or click to browse", hint = "Max 100 MB per file", }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length > 0)
            onUpload(e.dataTransfer.files);
    };
    const handleChange = () => {
        if (inputRef.current?.files?.length)
            onUpload(inputRef.current.files);
    };
    if (collapsed) {
        return (_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-4", children: [_jsx("button", { onClick: () => setCollapsed(false), className: "hover:text-gray-600 dark:hover:text-gray-300 transition-colors", title: "Show upload area", children: "\u25B2" }), _jsx("span", { children: "Upload files" }), _jsx("button", { onClick: () => inputRef.current?.click(), className: "text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2", children: "Browse" }), _jsx("input", { ref: inputRef, type: "file", accept: accept, multiple: multiple, onChange: handleChange, className: "hidden" })] }));
    }
    return (_jsxs("div", { onDragOver: (e) => { e.preventDefault(); setDragging(true); }, onDragLeave: () => setDragging(false), onDrop: handleDrop, onClick: () => inputRef.current?.click(), className: `border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors relative ${dragging
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
            : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`, children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); setCollapsed(true); }, className: "absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xs", title: "Collapse", children: "\u25BC" }), _jsx("input", { ref: inputRef, type: "file", accept: accept, multiple: multiple, onChange: handleChange, className: "hidden" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 font-medium", children: label }), _jsx("p", { className: "text-gray-400 dark:text-gray-500 text-sm mt-1", children: hint })] }));
}
