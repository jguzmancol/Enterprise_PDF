import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { addPageNumbers } from "../../api/client";
import FileCard from "../FileCard";
import FileDropzone from "../FileDropzone";
const POSITIONS = [
    { v: "bottom-center", label: "Bottom Center" },
    { v: "bottom-left", label: "Bottom Left" },
    { v: "bottom-right", label: "Bottom Right" },
    { v: "top-center", label: "Top Center" },
    { v: "top-left", label: "Top Left" },
    { v: "top-right", label: "Top Right" },
];
function PageNumbersView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }, ref) {
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [template, setTemplate] = useState("Page {n} of {total}");
    const [position, setPosition] = useState("bottom-center");
    const [fontSize, setFontSize] = useState(10);
    const [startFrom, setStartFrom] = useState(1);
    const [color, setColor] = useState("#000000");
    const selected = files.find((f) => f.id === selectedId);
    useEffect(() => {
        if (files.length > 0) {
            if (!selectedId || !files.find((f) => f.id === selectedId)) {
                setSelectedId(files[0].id);
            }
        }
    }, [files, selectedId]);
    const hexToRgb = (hex) => {
        const clean = hex.replace("#", "");
        const bigint = parseInt(clean, 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };
    const handleAddNumbers = async () => {
        if (!selectedId)
            return;
        setLoading(true);
        onTabLoadingChange?.(true);
        onTabDownloadIdChange?.(null);
        try {
            const result = await addPageNumbers(selectedId, {
                template,
                position,
                font_size: fontSize,
                start_from: startFrom,
                margin: 40,
                color: hexToRgb(color),
            });
            onTabDownloadIdChange?.(result.download_id);
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "Page numbers failed");
        }
        finally {
            setLoading(false);
            onTabLoadingChange?.(false);
        }
    };
    useImperativeHandle(ref, () => ({
        action: handleAddNumbers,
        reset: () => setSelectedId(null),
        hasPages: selected != null,
        loading,
    }), [selected, loading, handleAddNumbers]);
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to add page numbers." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Page Numbers" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to number:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsxs("div", { className: "space-y-4 max-w-md", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Template" }), _jsx("input", { type: "text", value: template, onChange: (e) => setTemplate(e.target.value), className: "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm" }), _jsxs("p", { className: "text-xs text-gray-400 dark:text-gray-500 mt-1", children: ["Use ", "{n}", " for the page number and ", "{total}", " for the page count."] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Position" }), _jsx("div", { className: "flex flex-wrap gap-2", children: POSITIONS.map((p) => (_jsx("button", { onClick: () => setPosition(p.v), className: `px-3 py-1 text-sm rounded border transition-colors ${position === p.v
                                                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: p.label }, p.v))) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0", children: "Font size" }), _jsx("input", { type: "range", min: "6", max: "40", value: fontSize, onChange: (e) => setFontSize(Number(e.target.value)), className: "flex-1 accent-blue-600" }), _jsx("span", { className: "text-sm font-mono w-12 text-right", children: fontSize })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0", children: "Start at" }), _jsx("input", { type: "number", min: "1", value: startFrom, onChange: (e) => setStartFrom(Number(e.target.value)), className: "w-20 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0", children: "Color" }), _jsx("input", { type: "color", value: color, onChange: (e) => setColor(e.target.value), className: "h-9 w-14 rounded border border-gray-300 dark:border-gray-600 bg-transparent" })] })] })] }))] }));
}
export default forwardRef(PageNumbersView);
