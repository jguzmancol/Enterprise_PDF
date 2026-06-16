import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { FileInfo, TabActions } from "../../types";
import { reorderFile, rotatePage, previewUrl } from "../../api/client";
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

function ReorderView({ files, removeFile, thumbnailSize, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }: Props, ref: React.Ref<TabActions>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [pageVersions, setPageVersions] = useState<Record<string, number>>({});

  const selected = files.find((f) => f.id === selectedId);

  useEffect(() => {
    if (files.length > 0) {
      if (!selectedId || !files.find((f) => f.id === selectedId)) {
        setSelectedId(files[0].id);
      }
    }
  }, [files, selectedId]);

  const initOrder = () => {
    if (!selected) return;
    setOrder(Array.from({ length: selected.page_count }, (_, i) => i + 1));
  };

  if (selected && order.length === 0) {
    initOrder();
  }

  const handleDeletePage = (idx: number) => {
    setOrder(order.filter((_, i) => i !== idx));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...order];
    [next[dragIdx], next[idx]] = [next[idx], next[dragIdx]];
    setDragIdx(idx);
    setOrder(next);
  };

  const handleDragEnd = () => setDragIdx(null);

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

  const handleReorder = async () => {
    if (!selectedId) return;
    setLoading(true);
    onTabLoadingChange?.(true);
    onTabDownloadIdChange?.(null);
    try {
      const result = await reorderFile(selectedId, order);
      onTabDownloadIdChange?.(result.download_id);
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setLoading(false);
      onTabLoadingChange?.(false);
    }
  };

  useImperativeHandle(ref, () => ({
    action: handleReorder,
    reset: () => { setSelectedId(null); setOrder([]); },
    hasPages: order.length > 0,
    loading,
  }), [order.length, loading, handleReorder]);

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
          Upload a PDF to reorder its pages.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Reorder Pages</h2>

      {!selected ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Select a file to reorder:
          </p>
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
            <FileCard file={selected} selected />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Drag to reorder, remove pages you don't want.
          </p>

          <div
            className="grid gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize || 80}px, 1fr))` }}
          >
            {order.map((pageNum, idx) => (
                <div
                  key={pageNum}
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
                          handleRotate(pageNum);
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
                    src={getPreviewSrc(pageNum)}
                    alt={`Page ${pageNum}`}
                    size={thumbnailSize}
                  />
                  <span className="block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5">
                    p.{pageNum}
                  </span>
                </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}

export default forwardRef(ReorderView);
