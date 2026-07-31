import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { textWatermark, imageWatermark } from "../../api/client";
import FileCard from "../FileCard";
import FileDropzone from "../FileDropzone";
const POSITIONS = ["center", "tile"];
function WatermarkView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }, ref) {
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("text");
    const [text, setText] = useState("CONFIDENCIAL");
    const [opacity, setOpacity] = useState(0.3);
    const [fontSize, setFontSize] = useState(60);
    const [rotation, setRotation] = useState(45);
    const [color, setColor] = useState("#808080");
    const [position, setPosition] = useState("center");
    const [image, setImage] = useState(null);
    const imageInputRef = useRef(null);
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
    const handleWatermark = async () => {
        if (!selectedId)
            return;
        if (mode === "image" && !image) {
            alert("Select a watermark image first");
            return;
        }
        setLoading(true);
        onTabLoadingChange?.(true);
        onTabDownloadIdChange?.(null);
        try {
            const result = mode === "text"
                ? await textWatermark(selectedId, {
                    text,
                    opacity,
                    font_size: fontSize,
                    color: hexToRgb(color),
                    rotation,
                    position,
                })
                : await imageWatermark(selectedId, image, opacity, position);
            onTabDownloadIdChange?.(result.download_id);
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "Watermark failed");
        }
        finally {
            setLoading(false);
            onTabLoadingChange?.(false);
        }
    };
    useImperativeHandle(ref, () => ({
        action: handleWatermark,
        reset: () => { setSelectedId(null); setImage(null); },
        hasPages: selected != null && (mode === "text" || image != null),
        loading,
    }), [selected, mode, image, loading, handleWatermark]);
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to add a watermark." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Watermark" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file to watermark:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("button", { onClick: () => setMode("text"), className: `px-4 py-2 text-sm rounded-lg border transition-colors ${mode === "text"
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: "Text" }), _jsx("button", { onClick: () => setMode("image"), className: `px-4 py-2 text-sm rounded-lg border transition-colors ${mode === "image"
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: "Image" })] }), _jsxs("div", { className: "space-y-4 max-w-md", children: [mode === "text" ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Text" }), _jsx("input", { type: "text", value: text, onChange: (e) => setText(e.target.value), className: "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0", children: "Color" }), _jsx("input", { type: "color", value: color, onChange: (e) => setColor(e.target.value), className: "h-9 w-14 rounded border border-gray-300 dark:border-gray-600 bg-transparent" })] })] })) : (_jsxs("div", { children: [_jsx("input", { ref: imageInputRef, type: "file", accept: "image/png,image/jpeg,image/webp,image/bmp,image/tiff", onChange: (e) => setImage(e.target.files?.[0] ?? null), className: "hidden" }), _jsx("button", { onClick: () => imageInputRef.current?.click(), className: "w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors", children: image ? image.name : "Choose watermark image" })] })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0", children: "Opacity" }), _jsx("input", { type: "range", min: "0.05", max: "1", step: "0.05", value: opacity, onChange: (e) => setOpacity(Number(e.target.value)), className: "flex-1 accent-blue-600" }), _jsxs("span", { className: "text-sm font-mono w-12 text-right", children: [Math.round(opacity * 100), "%"] })] }), mode === "text" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0", children: "Font size" }), _jsx("input", { type: "range", min: "12", max: "120", value: fontSize, onChange: (e) => setFontSize(Number(e.target.value)), className: "flex-1 accent-blue-600" }), _jsx("span", { className: "text-sm font-mono w-12 text-right", children: fontSize })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("label", { className: "text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0", children: "Rotation" }), _jsx("input", { type: "range", min: "0", max: "360", value: rotation, onChange: (e) => setRotation(Number(e.target.value)), className: "flex-1 accent-blue-600" }), _jsxs("span", { className: "text-sm font-mono w-12 text-right", children: [rotation, "\u00B0"] })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Position" }), _jsx("div", { className: "flex gap-2", children: POSITIONS.map((p) => (_jsx("button", { onClick: () => setPosition(p), className: `px-3 py-1 text-sm rounded border transition-colors ${position === p
                                                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: p[0].toUpperCase() + p.slice(1) }, p))) })] })] })] }))] }));
}
export default forwardRef(WatermarkView);
