import { useState, useCallback } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import type { FileInfo } from "./types";
import { uploadFiles } from "./api/client";
import Layout from "./components/Layout";
import MergeView from "./components/views/MergeView";
import SplitView from "./components/views/SplitView";
import CompressView from "./components/views/CompressView";
import RotateView from "./components/views/RotateView";
import ReorderView from "./components/views/ReorderView";
import ImageToPdfView from "./components/views/ImageToPdfView";

export default function App() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpload = useCallback(async (fileList: FileList | File[]) => {
    setError(null);
    try {
      const resp = await uploadFiles(fileList);
      setFiles((prev) => [...prev, ...resp.files]);
      if (resp.files.length > 0 && window.location.hash === "#/") {
        navigate("/merge");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }, [navigate]);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

  return (
    <Layout
      files={files}
      onUpload={handleUpload}
      error={error}
      onClearFiles={clearFiles}
      onRemoveFile={removeFile}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/merge" replace />} />
        <Route
          path="/merge"
          element={<MergeView files={files} />}
        />
        <Route
          path="/split"
          element={<SplitView files={files} removeFile={removeFile} />}
        />
        <Route
          path="/compress"
          element={<CompressView files={files} />}
        />
        <Route
          path="/rotate"
          element={<RotateView files={files} />}
        />
        <Route
          path="/reorder"
          element={<ReorderView files={files} removeFile={removeFile} />}
        />
        <Route path="/image-to-pdf" element={<ImageToPdfView />} />
      </Routes>
    </Layout>
  );
}
