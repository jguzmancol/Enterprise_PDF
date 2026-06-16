import { useState, useCallback, useEffect, useRef } from "react";
import { Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import type { FileInfo, TabActions } from "./types";
import { uploadFiles } from "./api/client";
import Layout from "./components/Layout";
import MergeView from "./components/views/MergeView";
import SplitView from "./components/views/SplitView";
import CompressView from "./components/views/CompressView";
import RotateView from "./components/views/RotateView";
import ReorderView from "./components/views/ReorderView";
import ImageToPdfView from "./components/views/ImageToPdfView";
import OfficeView from "./components/views/OfficeView";

const TAB_KEYS: Record<string, string> = {
  "/merge": "merge",
  "/split": "split",
  "/compress": "compress",
  "/office": "office",
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
  const [tabFilename, setTabFilename] = useState("");
  const [tabLoading, setTabLoading] = useState(false);
  const [tabDownloadId, setTabDownloadId] = useState<string | null>(null);
  const tabActionsRef = useRef<TabActions | null>(null);
  const [uploadedAt, setUploadedAt] = useState<number | null>(null);
  const [fileTtl, setFileTtl] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = tabKeyFromPath(location.pathname);
  useEffect(() => { setTabDownloadId(null); setTabFilename(""); }, [currentTab]);

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

  useEffect(() => {
    if (!uploadedAt || fileTtl === 0 || files.length === 0) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setTimeLeft(null);
      return;
    }
    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil(fileTtl - (Date.now() - uploadedAt) / 1000);
      if (remaining <= 0) {
        setTimeLeft(null);
        setUploadedAt(null);
        setFileTtl(0);
        setError("Session expired. Please upload the files again.");
        clearFiles();
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [uploadedAt, fileTtl, files.length]);

  const handleUpload = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      try {
        const resp = await uploadFiles(fileList);
        setUploadedAt(Date.now());
        setFileTtl(resp.ttl_seconds);
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
    setTabDownloadId(null);
    setTabFilename("");
    if (useSharedFiles) {
      setSharedFiles([]);
      setTabFiles({});
    } else {
      updateTabFiles(currentTab, () => []);
    }
  }, [useSharedFiles, currentTab, updateTabFiles]);

  const handleApiError = useCallback((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("not found")) {
      setUploadedAt(null);
      setFileTtl(0);
      setTimeLeft(null);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setError("Session expired. The files are no longer available. Please upload again.");
      clearFiles();
      return true;
    }
    return false;
  }, [clearFiles]);

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
      timeLeft={timeLeft}
      tabActionsRef={tabActionsRef}
      tabFilename={tabFilename}
      onTabFilenameChange={setTabFilename}
      tabLoading={tabLoading}
      tabDownloadId={tabDownloadId}
      tabHasPages={files.length > 0}
      currentTab={currentTab}
      onDownload={() => { setTabDownloadId(null); setTabFilename(""); }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/merge" replace />} />
        <Route
          path="/merge"
          element={<MergeView ref={tabActionsRef} files={files} thumbnailSize={thumbnailSize} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} multiple={allowMultiple} onApiError={handleApiError} tabFilename={tabFilename} onTabLoadingChange={setTabLoading} onTabDownloadIdChange={setTabDownloadId} />}
        />
        <Route
          path="/split"
          element={<SplitView ref={tabActionsRef} files={files} removeFile={removeFile} thumbnailSize={thumbnailSize} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} onApiError={handleApiError} tabFilename={tabFilename} onTabLoadingChange={setTabLoading} onTabDownloadIdChange={setTabDownloadId} />}
        />
        <Route
          path="/compress"
          element={<CompressView ref={tabActionsRef} files={files} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} onApiError={handleApiError} tabFilename={tabFilename} onTabLoadingChange={setTabLoading} onTabDownloadIdChange={setTabDownloadId} />}
        />
        <Route
          path="/office"
          element={<OfficeView ref={tabActionsRef} files={files} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} onApiError={handleApiError} tabFilename={tabFilename} onTabLoadingChange={setTabLoading} onTabDownloadIdChange={setTabDownloadId} />}
        />
        <Route
          path="/rotate"
          element={<RotateView ref={tabActionsRef} files={files} thumbnailSize={thumbnailSize} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} onApiError={handleApiError} tabFilename={tabFilename} onTabLoadingChange={setTabLoading} onTabDownloadIdChange={setTabDownloadId} />}
        />
        <Route
          path="/reorder"
          element={<ReorderView ref={tabActionsRef} files={files} removeFile={removeFile} thumbnailSize={thumbnailSize} onUpload={handleUpload} error={error} useSharedFiles={useSharedFiles} onApiError={handleApiError} tabFilename={tabFilename} onTabLoadingChange={setTabLoading} onTabDownloadIdChange={setTabDownloadId} />}
        />
        <Route path="/image-to-pdf" element={<ImageToPdfView />} />
      </Routes>
    </Layout>
  );
}
