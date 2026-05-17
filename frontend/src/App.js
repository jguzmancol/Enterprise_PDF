import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { uploadFiles } from "./api/client";
import Layout from "./components/Layout";
import MergeView from "./components/views/MergeView";
import SplitView from "./components/views/SplitView";
import CompressView from "./components/views/CompressView";
import RotateView from "./components/views/RotateView";
import ReorderView from "./components/views/ReorderView";
import ImageToPdfView from "./components/views/ImageToPdfView";
export default function App() {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [thumbnailSize, setThumbnailSize] = useState(100);
    const navigate = useNavigate();
    const handleUpload = useCallback(async (fileList) => {
        setError(null);
        try {
            const resp = await uploadFiles(fileList);
            setFiles((prev) => [...prev, ...resp.files]);
            if (resp.files.length > 0 && window.location.hash === "#/") {
                navigate("/merge");
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed");
        }
    }, [navigate]);
    const removeFile = useCallback((fileId) => {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }, []);
    const clearFiles = useCallback(() => setFiles([]), []);
    return (_jsx(Layout, { files: files, onClearFiles: clearFiles, thumbnailSize: thumbnailSize, onThumbnailSizeChange: setThumbnailSize, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/merge", replace: true }) }), _jsx(Route, { path: "/merge", element: _jsx(MergeView, { files: files, thumbnailSize: thumbnailSize, onUpload: handleUpload, error: error }) }), _jsx(Route, { path: "/split", element: _jsx(SplitView, { files: files, removeFile: removeFile, thumbnailSize: thumbnailSize }) }), _jsx(Route, { path: "/compress", element: _jsx(CompressView, { files: files }) }), _jsx(Route, { path: "/rotate", element: _jsx(RotateView, { files: files, thumbnailSize: thumbnailSize }) }), _jsx(Route, { path: "/reorder", element: _jsx(ReorderView, { files: files, removeFile: removeFile, thumbnailSize: thumbnailSize }) }), _jsx(Route, { path: "/image-to-pdf", element: _jsx(ImageToPdfView, {}) })] }) }));
}
