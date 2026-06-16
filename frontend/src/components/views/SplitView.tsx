import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { FileInfo, TabActions } from "../../types";
import { splitFile, rotatePage, previewUrl } from "../../api/client";
import FileCard from "../FileCard";
import PreviewImage from "../PreviewImage";
import FileDropzone from "../FileDropzone";

interface Props {
  files: FileInfo[];
  removeFile: (id: string) => void;
  thumbnailSize?: number;
  onUpload?: (files: FileList | File[]) => void;
  error?: string | null;
  useSharedFiles?: boolean;
  onApiError?: (e: unknown) => boolean;
  tabFilename?: string;
  onTabLoadingChange?: (v: boolean) => void;
  onTabDownloadIdChange?: (v: string | null) => void;
}

function SplitView({ files, removeFile, thumbnailSize, onUpload, error, useSharedFiles, onApiError, tabFilename, onTabLoadingChange, onTabDownloadIdChange }: Props, ref: React.Ref<TabActions>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageVersions, setPageVersions] = useState<Record<string, number>>({});
  const [rangesText, setRangesText] = useState("");

  const selected = files.find((f) => f.id === selectedId);

  useEffect(() => {
    if (files.length > 0) {
      if (!selectedId || !files.find((f) => f.id === selectedId)) {
        setSelectedId(files[0].id);
      }
    }
  }, [files, selectedId]);

  const appendToRanges = (page: number) => {
    const current = rangesText.trim();
    if (!current) {
      setRangesText(String(page));
    } else {
      const parts = current.split(",").map((s) => s.trim()).filter(Boolean);
      const last = parts[parts.length - 1];
      const rangeMatch = last.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const rangeStart = parseInt(rangeMatch[1]);
        const rangeEnd = parseInt(rangeMatch[2]);
        if (page === rangeEnd + 1) {
          parts[parts.length - 1] = `${rangeStart}-${page}`;
          setRangesText(parts.join(", "));
          return;
        }
      }
      parts.push(String(page));
      setRangesText(parts.join(", "));
    }
  };

  const handleRotate = async (pageNum: number) => {
    if (!selectedId) return;
    try {
      await rotatePage(selectedId, pageNum);
      const key = `${selectedId}-${pageNum}`;
      setPageVersions((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "Rotation failed");
    }
  };

  const getPreviewSrc = (pageNum: number) => {
    if (!selectedId) return "";
    const key = `${selectedId}-${pageNum}`;
    const v = pageVersions[key] ?? 0;
    return `${previewUrl(selectedId, pageNum, thumbnailSize)}&v=${v}`;
  };

  const handleSplit = async () => {
    if (!selectedId) return;
    const ranges = rangesText.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((part) => {
        const m = part.match(/^(\d+)-(\d+)$/);
        if (m) return [parseInt(m[1]), parseInt(m[2])] as [number, number];
        const n = parseInt(part);
        if (!isNaN(n)) return [n, n] as [number, number];
        return null;
      })
      .filter(Boolean) as number[][];

    if (ranges.length === 0) {
      alert("Enter at least one page range (e.g. 1-3, 5, 7-9)");
      return;
    }

    setLoading(true);
    onTabLoadingChange?.(true);
    onTabDownloadIdChange?.(null);
    try {
      const result = await splitFile(selectedId, ranges, tabFilename || undefined);
      onTabDownloadIdChange?.(result.download_id);
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "Split failed");
    } finally {
      setLoading(false);
      onTabLoadingChange?.(false);
    }
  };

  const canSplit = rangesText.trim().length > 0 && selected != null;

  useImperativeHandle(ref, () => ({
    action: handleSplit,
    reset: () => { setSelectedId(null); setRangesText(""); },
    hasPages: canSplit,
    loading,
  }), [canSplit, loading, handleSplit]);

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
          Upload a PDF to split it into parts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Split PDF</h2>

      {!selected ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Select a file to split:</p>
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className="cursor-pointer"
              >
                <FileCard file={f} onRemove={removeFile} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <FileCard file={selected} onRemove={removeFile} selected />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={rangesText}
              onChange={(e) => setRangesText(e.target.value)}
              placeholder="1-3, 5, 7-9"
              className="w-40 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Click pages to add, or type ranges
            </span>
          </div>

          <div
            className="grid gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg mb-4"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize || 80}px, 1fr))` }}
          >
            {Array.from({ length: selected.page_count }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => appendToRanges(pageNum)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-1 hover:border-blue-300 transition-colors"
                >
                  <div className="relative">
                    <PreviewImage
                      src={getPreviewSrc(pageNum)}
                      alt={`Page ${pageNum}`}
                      size={thumbnailSize}
                    />
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotate(pageNum);
                      }}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm cursor-pointer transition-colors"
                      title="Rotate 90°"
                    >
                      &#8635;
                    </span>
                  </div>
                  <span className="block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5">
                    {pageNum}
                  </span>
                </button>
              )
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default forwardRef(SplitView);