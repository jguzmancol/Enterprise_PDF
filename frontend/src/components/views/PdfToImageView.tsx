import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { FileInfo, TabActions } from "../../types";
import { pdfToImages } from "../../api/client";
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

function PdfToImageView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }: Props, ref: React.Ref<TabActions>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [dpi, setDpi] = useState(150);

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
      const result = await pdfToImages(selectedId, format, dpi);
      onTabDownloadIdChange?.(result.download_id);
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "PDF to image failed");
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
          Upload a PDF to convert its pages to images (downloads a ZIP).
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">PDF to Image</h2>

      {!selected ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Select a file to convert:
          </p>
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
            <span className="text-sm text-gray-500 dark:text-gray-400">Format:</span>
            <button
              onClick={() => setFormat("png")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                format === "png"
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setFormat("jpg")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                format === "jpg"
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"
              }`}
            >
              JPG
            </button>
          </div>

          <div className="flex items-center gap-3 max-w-md">
            <label className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">DPI</label>
            <input
              type="range"
              min="50"
              max="400"
              step="10"
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span className="text-sm font-mono w-12 text-right">{dpi}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default forwardRef(PdfToImageView);
