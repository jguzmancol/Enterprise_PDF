import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { FileInfo, TabActions } from "../../types";
import FileCard from "../FileCard";
import FileDropzone from "../FileDropzone";

interface Props {
  files: FileInfo[];
  onUpload?: (files: FileList | File[]) => void;
  error?: string | null;
  useSharedFiles?: boolean;
  onApiError?: (e: unknown) => boolean;
  tabFilename?: string;
  onTabLoadingChange?: (v: boolean) => void;
  onTabDownloadIdChange?: (v: string | null) => void;
}

type Format = "docx" | "xlsx";

function OfficeView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }: Props, ref: React.Ref<TabActions>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<Format>("docx");

  const selected = files.find((f) => f.id === selectedId);

  useEffect(() => {
    if (files.length > 0) {
      if (!selectedId || !files.find((f) => f.id === selectedId)) {
        setSelectedId(files[0].id);
      }
    }
  }, [files, selectedId]);

  const handleConvert = async () => {
    if (!selectedId) return;
    setLoading(true);
    onTabLoadingChange?.(true);
    onTabDownloadIdChange?.(null);
    try {
      const endpoint = format === "docx" ? "/api/to-docx" : "/api/to-xlsx";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: selectedId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || res.statusText);
      }
      const result = await res.json();
      onTabDownloadIdChange?.(result.download_id);
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
      onTabLoadingChange?.(false);
    }
  };

  useImperativeHandle(ref, () => ({
    action: handleConvert,
    reset: () => setSelectedId(null),
    hasPages: selected != null,
    loading,
  }), [selected, loading, handleConvert]);

  if (files.length === 0) {
    return (
      <div>
        {!useSharedFiles && onUpload && (
          <div className="mb-4">
            <FileDropzone onUpload={onUpload} multiple={false} />
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Upload a PDF to convert it to Word or Excel.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">PDF to Office</h2>

      {!selected ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Select a file to convert:</p>
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} onClick={() => setSelectedId(f.id)} className="cursor-pointer">
                <FileCard file={f} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <FileCard file={selected} selected />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Convert to:</span>
            <button
              onClick={() => setFormat("docx")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                format === "docx"
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"
              }`}
            >
              Word (.docx)
            </button>
            <button
              onClick={() => setFormat("xlsx")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                format === "xlsx"
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"
              }`}
            >
              Excel (.xlsx)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default forwardRef(OfficeView);
