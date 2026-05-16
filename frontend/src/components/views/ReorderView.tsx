import { useState } from "react";
import type { FileInfo } from "../../types";
import { reorderFile, rotatePage, previewUrl, downloadUrl } from "../../api/client";
import FileCard from "../FileCard";
import PreviewImage from "../PreviewImage";

interface Props {
  files: FileInfo[];
  removeFile: (id: string) => void;
  thumbnailSize?: number;
}

export default function ReorderView({ files, removeFile, thumbnailSize }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pageVersions, setPageVersions] = useState<Record<string, number>>({});
  const [filename, setFilename] = useState("");

  const selected = files.find((f) => f.id === selectedId);

  const initOrder = () => {
    if (!selected) return;
    setOrder(Array.from({ length: selected.page_count }, (_, i) => i + 1));
    setSelectedPages(new Set());
  };

  if (selected && order.length === 0) {
    initOrder();
  }

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
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

  const toggleSelect = (idx: number) => {
    const next = new Set(selectedPages);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedPages(next);
  };

  const deleteSelected = () => {
    setOrder(order.filter((_, idx) => !selectedPages.has(idx)));
    setSelectedPages(new Set());
  };

  const handleRotate = async (pageNum: number) => {
    if (!selectedId) return;
    try {
      await rotatePage(selectedId, pageNum);
      const key = `${selectedId}-${pageNum}`;
      setPageVersions((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Rotation failed");
    }
  };

  const getPreviewSrc = (pageNum: number) => {
    if (!selectedId) return "";
    const key = `${selectedId}-${pageNum}`;
    const v = pageVersions[key] ?? 0;
    return `${previewUrl(selectedId, pageNum)}?v=${v}`;
  };

  const handleReorder = async () => {
    if (!selectedId) return;
    setLoading(true);
    setDownloadId(null);
    try {
      const result = await reorderFile(selectedId, order);
      setDownloadId(result.download_id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setLoading(false);
    }
  };

  if (files.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Upload a PDF to reorder its pages.
      </p>
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
            Click thumbnails to select pages, then delete. Drag or use arrows
            to reorder.
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-96 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
            {order.map((pageNum, idx) => {
              const isSelected = selectedPages.has(idx);
              return (
                <div
                  key={pageNum}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => toggleSelect(idx)}
                  className={`relative border rounded-lg p-1 cursor-pointer transition-colors ${
                    dragIdx === idx
                      ? "border-blue-400 opacity-50"
                      : isSelected
                      ? "border-blue-500 ring-2 ring-blue-300"
                      : "border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      {idx + 1}
                    </span>
                    <div className="flex gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); move(idx, -1); }}
                        disabled={idx === 0}
                        className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 disabled:opacity-30"
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); move(idx, 1); }}
                        disabled={idx === order.length - 1}
                        className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 disabled:opacity-30"
                      >
                        &#9660;
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <PreviewImage
                      src={getPreviewSrc(pageNum)}
                      alt={`Page ${pageNum}`}
                      size={thumbnailSize}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotate(pageNum);
                      }}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm transition-colors"
                      title="Rotate 90°"
                    >
                      &#8635;
                    </button>
                  </div>
                  <span className="block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5">
                    p.{pageNum}
                  </span>
                </div>
              );
            })}
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4 mb-1">
            Output filename
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="reordered.pdf"
            className="w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setSelectedId(null); setOrder([]); setSelectedPages(new Set()); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => initOrder()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Reset order
            </button>
            {selectedPages.size > 0 && (
              <button
                onClick={deleteSelected}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Delete selected ({selectedPages.size})
              </button>
            )}
            <button
              onClick={handleReorder}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Reordering..." : "Apply new order"}
            </button>
          </div>

          {downloadId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm mb-2">Reordering complete!</p>
          <a
            href={downloadUrl(downloadId, filename || undefined)}
            download
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
          >
            Download reordered PDF
          </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
