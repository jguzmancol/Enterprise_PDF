import { useState, useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import type { FileInfo, TabActions } from "../../types";
import { mergePages, rotatePage, previewUrl } from "../../api/client";
import PreviewImage from "../PreviewImage";
import FileDropzone from "../FileDropzone";

interface Props {
  files: FileInfo[];
  thumbnailSize?: number;
  onUpload?: (files: FileList | File[]) => void;
  error?: string | null;
  useSharedFiles?: boolean;
  multiple?: boolean;
  onApiError?: (e: unknown) => boolean;
  tabFilename?: string;
  onTabLoadingChange?: (v: boolean) => void;
  onTabDownloadIdChange?: (v: string | null) => void;
}

interface PageEntry {
  fileId: string;
  page: number;
  fileName: string;
}

function MergeView({ files, thumbnailSize, onUpload, error, useSharedFiles, multiple = true, onApiError, onTabLoadingChange, onTabDownloadIdChange }: Props, ref: React.Ref<TabActions>) {
  const [loading, setLoading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [order, setOrder] = useState<number[] | null>(null);
  const [pageVersions, setPageVersions] = useState<Record<string, number>>({});
  const prevFilesKey = useRef("");

  const filesKey = files.map((f) => f.id).join(",");
  useEffect(() => {
    if (prevFilesKey.current && prevFilesKey.current !== filesKey) {
      setOrder(null);
    }
    prevFilesKey.current = filesKey;
  }, [filesKey]);

  const allPages = useMemo(() => {
    const pages: PageEntry[] = [];
    for (const f of files) {
      for (let p = 1; p <= f.page_count; p++) {
        pages.push({ fileId: f.id, page: p, fileName: f.original_name });
      }
    }
    return pages;
  }, [files]);

  const displayOrder = order ?? allPages.map((_, i) => i);

  const handleMerge = async () => {
    setLoading(true);
    onTabLoadingChange?.(true);
    onTabDownloadIdChange?.(null);
    try {
      const filePages = displayOrder.map((i) => ({
        file_id: allPages[i].fileId,
        page: allPages[i].page,
      }));
      const result = await mergePages(filePages);
      onTabDownloadIdChange?.(result.download_id);
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setLoading(false);
      onTabLoadingChange?.(false);
    }
  };

  useImperativeHandle(ref, () => ({
    action: handleMerge,
    reset: () => setOrder(null),
    hasPages: displayOrder.length > 0,
    loading,
  }), [displayOrder.length, loading, handleMerge]);

  if (files.length === 0) {
    return (
      <div>
        {!useSharedFiles && onUpload && (
          <div className="mb-4">
            <FileDropzone onUpload={onUpload} multiple={multiple} />
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Upload at least one PDF to get started.
        </p>
      </div>
    );
  }

  const handleDeletePage = (idx: number) => {
    setOrder(displayOrder.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...displayOrder];
    [next[dragIdx], next[idx]] = [next[idx], next[dragIdx]];
    setDragIdx(idx);
    setOrder(next);
  };

  const handleDragEnd = () => setDragIdx(null);

  const handleRotate = async (fileId: string, page: number) => {
    try {
      await rotatePage(fileId, page);
      const key = `${fileId}-${page}`;
      setPageVersions((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "Rotation failed");
    }
  };

  const getPreviewSrc = (fileId: string, page: number) => {
    const key = `${fileId}-${page}`;
    const v = pageVersions[key] ?? 0;
    return `${previewUrl(fileId, page, thumbnailSize)}&v=${v}`;
  };

  return (
    <div>
      {!useSharedFiles && onUpload && (
        <div className="mb-4">
          <FileDropzone onUpload={onUpload} multiple={multiple} />
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      )}
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Merge PDFs</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        All pages from your uploaded files. Drag to reorder, remove
        unwanted pages, then merge.
      </p>

      <div
        className="grid gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize || 80}px, 1fr))` }}
      >
        {displayOrder.map((pageIdx, idx) => {
          const entry = allPages[pageIdx];
          return (
              <div
                key={`${entry.fileId}-${entry.page}-${idx}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`relative border rounded-lg p-1 cursor-pointer transition-colors ${
                  dragIdx === idx
                    ? "border-blue-400 opacity-50"
                    : "border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotate(entry.fileId, entry.page);
                      }}
                      className="w-6 h-6 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm transition-colors"
                      title="Rotate 90°"
                    >
                      &#8635;
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(idx);
                      }}
                      className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 border border-red-400 flex items-center justify-center text-xs text-white shadow-sm transition-colors"
                      title="Remove"
                    >
                      &#10005;
                    </button>
                  </div>
                </div>
                <PreviewImage
                  src={getPreviewSrc(entry.fileId, entry.page)}
                  alt={`${entry.fileName} - page ${entry.page}`}
                  size={thumbnailSize}
                />
                <span className="block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5 truncate" title={`${entry.fileName} p.${entry.page}`}>
                  {entry.fileName} p.{entry.page}
                </span>
              </div>
          );
        })}
      </div>

    </div>
  );
}

export default forwardRef(MergeView);
