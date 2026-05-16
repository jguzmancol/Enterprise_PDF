import { useState, useMemo, useRef, useEffect } from "react";
import type { FileInfo } from "../../types";
import { mergePages, rotatePage, previewUrl, downloadUrl } from "../../api/client";
import PreviewImage from "../PreviewImage";

interface Props {
  files: FileInfo[];
}

interface PageEntry {
  fileId: string;
  page: number;
  fileName: string;
}

export default function MergeView({ files }: Props) {
  const [loading, setLoading] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [order, setOrder] = useState<number[] | null>(null);
  const [pageVersions, setPageVersions] = useState<Record<string, number>>({});
  const [filename, setFilename] = useState("");
  const prevFilesKey = useRef("");

  const filesKey = files.map((f) => f.id).join(",");
  useEffect(() => {
    if (prevFilesKey.current && prevFilesKey.current !== filesKey) {
      setOrder(null);
      setSelected(new Set());
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

  if (files.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Upload at least one PDF to get started.
      </p>
    );
  }

  const toggleSelect = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  };

  const deleteSelected = () => {
    setOrder(displayOrder.filter((_, idx) => !selected.has(idx)));
    setSelected(new Set());
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...displayOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
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
      alert(e instanceof Error ? e.message : "Rotation failed");
    }
  };

  const getPreviewSrc = (fileId: string, page: number) => {
    const key = `${fileId}-${page}`;
    const v = pageVersions[key] ?? 0;
    return `${previewUrl(fileId, page)}?v=${v}`;
  };

  const handleMerge = async () => {
    setLoading(true);
    setDownloadId(null);
    try {
      const filePages = displayOrder.map((i) => ({
        file_id: allPages[i].fileId,
        page: allPages[i].page,
      }));
      const result = await mergePages(filePages);
      setDownloadId(result.download_id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Merge PDFs</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        All pages from your uploaded files. Reorder, select, and remove
        unwanted pages, then merge.
      </p>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[60vh] overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
        {displayOrder.map((pageIdx, idx) => {
          const entry = allPages[pageIdx];
          const isSelected = selected.has(idx);
          return (
              <div
                key={`${entry.fileId}-${entry.page}-${idx}`}
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
                      disabled={idx === displayOrder.length - 1}
                      className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 disabled:opacity-30"
                    >
                      &#9660;
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <PreviewImage
                    src={getPreviewSrc(entry.fileId, entry.page)}
                    alt={`${entry.fileName} - page ${entry.page}`}
                    className="aspect-[3/4] w-full"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRotate(entry.fileId, entry.page);
                    }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm transition-colors"
                    title="Rotate 90°"
                  >
                    &#8635;
                  </button>
                </div>
                <span className="block text-[10px] text-center text-gray-400 dark:text-gray-500 mt-0.5 truncate" title={`${entry.fileName} p.${entry.page}`}>
                  {entry.fileName} p.{entry.page}
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
        placeholder="merged.pdf"
        className="w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => { setOrder(null); setSelected(new Set()); }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Reset
        </button>
        {selected.size > 0 && (
          <button
            onClick={deleteSelected}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Delete selected ({selected.size})
          </button>
        )}
        <button
          onClick={handleMerge}
          disabled={loading || displayOrder.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Merging..." : "Merge pages"}
        </button>
      </div>

      {downloadId && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-700 dark:text-green-300 text-sm mb-2">Merge complete!</p>
          <a
            href={downloadUrl(downloadId, filename || undefined)}
            download
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
          >
            Download merged PDF
          </a>
        </div>
      )}
    </div>
  );
}
