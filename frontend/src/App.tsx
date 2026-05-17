import { useState, useCallback } from "react";
import { Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import type { FileInfo } from "./types";
import { uploadFiles } from "./api/client";
import Layout from "./components/Layout";
import MergeView from "./components/views/MergeView";
import SplitView from "./components/views/SplitView";
import CompressView from "./components/views/CompressView";
import RotateView from "./components/views/RotateView";
import ReorderView from "./components/views/ReorderView";
import ImageToPdfView from "./components/views/ImageToPdfView";

const TAB_KEYS: Record<string, string> = {
  "/merge": "merge",
  "/split": "split",
  "/compress": "compress",
  "/rotate": "rotate",
  "/reorder": "reorder",
  "/image-to-pdf": "image-to-pdf",
};

function tabKeyFromPath(path: string): string {
  return TAB_KEYS[path] || "merge";
}

export default function App() {
  const [sharedFiles, setSharedFiles] = useState<FileInfo[]>([]);
  const [tabFiles, setTabFiles] = useState<Record<string, FileInfo[]>>({});
  const [useSharedFiles, setUseSharedFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailSize, setThumbnailSize] = useState(100);
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = tabKeyFromPath(location.pathname);

  const files = useSharedFiles
    ? sharedFiles
    : tabFiles[currentTab] || [];

  const allowMultiple = currentTab === "merge";

  const updateTabFiles = useCallback(
    (tab: string, updater: (prev: FileInfo[]) => FileInfo[]) => {
      setTabFiles((prev) => ({
        ...prev,
        [tab]: updater(prev[tab] || []),
      }));
    },
    []
  );

  const handleUpload = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      try {
        const resp = await uploadFiles(fileList);
        if (useSharedFiles) {
          setSharedFiles((prev) => [...prev, ...resp.files]);
        } else {
          updateTabFiles(currentTab, (prev) => [...prev, ...resp.files]);
        }
        if (resp.files.length > 0 && window.location.hash === "#/") {
          navigate("/merge");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    },
    [useSharedFiles, currentTab, updateTabFiles, navigate]
  );

  const removeFile = useCallback(
    (fileId: string) => {
      if (useSharedFiles) {
        setSharedFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        updateTabFiles(currentTab, (prev) =>
          prev.filter((f) => f.id !== fileId)
        );
      }
    },
    [useSharedFiles, currentTab, updateTabFiles]
  );

  const clearFiles = useCallback(() => {
    if (useSharedFiles) {
      setSharedFiles([]);
      setTabFiles({});
    } else {
      updateTabFiles(currentTab, () => []);
    }
  }, [useSharedFiles, currentTab, updateTabFiles]);

  return (
    <Layout
      files={files}
      onUpload={handleUpload}
      error={error}
      onClearFiles={clearFiles}
      thumbnailSize={thumbnailSize}
      onThumbnailSizeChange={setThumbnailSize}
      useSharedFiles={useSharedFiles}
      onToggleSharedFiles={setUseSharedFiles}
      multiple={allowMultiple}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/merge" replace />} />
        <Route
          path="/merge"
          element={<MergeView files={files} thumbnailSize={thumbnailSize} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} multiple={allowMultiple} />}
        />
        <Route
          path="/split"
          element={<SplitView files={files} removeFile={removeFile} thumbnailSize={thumbnailSize} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} />}
        />
        <Route
          path="/compress"
          element={<CompressView files={files} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} />}
        />
        <Route
          path="/rotate"
          element={<RotateView files={files} thumbnailSize={thumbnailSize} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} />}
        />
        <Route
          path="/reorder"
          element={<ReorderView files={files} removeFile={removeFile} thumbnailSize={thumbnailSize} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} />}
        />
        <Route path="/image-to-pdf" element={<ImageToPdfView />} />
      </Routes>
    </Layout>
  );
}
