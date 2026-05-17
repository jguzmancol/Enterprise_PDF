import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { uploadFiles } from "./api/client";
import Layout from "./components/Layout";
import MergeView from "./components/views/MergeView";
import SplitView from "./components/views/SplitView";
import CompressView from "./components/views/CompressView";
import RotateView from "./components/views/RotateView";
import ReorderView from "./components/views/ReorderView";
import ImageToPdfView from "./components/views/ImageToPdfView";
const TAB_KEYS = {
    "/merge": "merge",
    "/split": "split",
    "/compress": "compress",
    "/rotate": "rotate",
    "/reorder": "reorder",
    "/image-to-pdf": "image-to-pdf",
};
function tabKeyFromPath(path) {
    return TAB_KEYS[path] || "merge";
}
export default function App() {
    const [sharedFiles, setSharedFiles] = useState([]);
    const [tabFiles, setTabFiles] = useState({});
    const [useSharedFiles, setUseSharedFiles] = useState(true);
    const [error, setError] = useState(null);
    const [thumbnailSize, setThumbnailSize] = useState(100);
    const navigate = useNavigate();
    const location = useLocation();
    const currentTab = tabKeyFromPath(location.pathname);
    const files = useSharedFiles
        ? sharedFiles
        : tabFiles[currentTab] || [];
    const updateTabFiles = useCallback((tab, updater) => {
        setTabFiles((prev) => ({
            ...prev,
            [tab]: updater(prev[tab] || []),
        }));
    }, []);
    const handleUpload = useCallback(async (fileList) => {
        setError(null);
        try {
            const resp = await uploadFiles(fileList);
            if (useSharedFiles) {
                setSharedFiles((prev) => [...prev, ...resp.files]);
            }
            else {
                updateTabFiles(currentTab, (prev) => [...prev, ...resp.files]);
            }
            if (resp.files.length > 0 && window.location.hash === "#/") {
                navigate("/merge");
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed");
        }
    }, [useSharedFiles, currentTab, updateTabFiles, navigate]);
    const removeFile = useCallback((fileId) => {
        if (useSharedFiles) {
            setSharedFiles((prev) => prev.filter((f) => f.id !== fileId));
        }
        else {
            updateTabFiles(currentTab, (prev) => prev.filter((f) => f.id !== fileId));
        }
    }, [useSharedFiles, currentTab, updateTabFiles]);
    const clearFiles = useCallback(() => {
        if (useSharedFiles) {
            setSharedFiles([]);
            setTabFiles({});
        }
        else {
            updateTabFiles(currentTab, () => []);
        }
    }, [useSharedFiles, currentTab, updateTabFiles]);
    return (_jsx(Layout, { files: files, onUpload: handleUpload, error: error, onClearFiles: clearFiles, thumbnailSize: thumbnailSize, onThumbnailSizeChange: setThumbnailSize, useSharedFiles: useSharedFiles, onToggleSharedFiles: setUseSharedFiles, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/merge", replace: true }) }), _jsx(Route, { path: "/merge", element: _jsx(MergeView, { files: files, thumbnailSize: thumbnailSize }) }), _jsx(Route, { path: "/split", element: _jsx(SplitView, { files: files, removeFile: removeFile, thumbnailSize: thumbnailSize }) }), _jsx(Route, { path: "/compress", element: _jsx(CompressView, { files: files }) }), _jsx(Route, { path: "/rotate", element: _jsx(RotateView, { files: files, thumbnailSize: thumbnailSize }) }), _jsx(Route, { path: "/reorder", element: _jsx(ReorderView, { files: files, removeFile: removeFile, thumbnailSize: thumbnailSize }) }), _jsx(Route, { path: "/image-to-pdf", element: _jsx(ImageToPdfView, {}) })] }) }));
}
