import { useState } from "react";
import type { FileInfo } from "../../types";
import { splitFile, rotatePage, previewUrl, downloadUrl } from "../../api/client";
import FileCard from "../FileCard";
import PreviewImage from "../PreviewImage";

interface Props {
  files: FileInfo[];
  removeFile: (id: string) => void;
  thumbnailSize?: number;
}

export default function SplitView({ files, removeFile, thumbnailSize }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rangesText, setRangesText] = useState("");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const [pageVersions, setPageVersions] = useState<Record<string, number>>({});

  const selected = files.find((f) => f.id === selectedId);

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
    const ranges = rangesText
      .split(",")
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
    setDownloadId(null);
    setResultFilename("");
    try {
      const result = await splitFile(selectedId, ranges, filename || undefined);
      setDownloadId(result.download_id);
      setResultFilename(result.filename);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Split failed");
    } finally {
      setLoading(false);
    }
  };

  if (files.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Upload a PDF to split it into parts.
      </p>
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

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Click thumbnails to add pages, or type ranges manually.
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg mb-4">
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

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Page ranges (e.g. <code className="dark:text-gray-200">1-3, 5, 7-9</code>)
          </label>
          <input
            type="text"
            value={rangesText}
            onChange={(e) => setRangesText(e.target.value)}
            placeholder="1-3, 5, 7-9"
            className="w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Max page: {selected.page_count}
          </p>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 mt-4">
            Output filename
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="split.pdf"
            className="w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setSelectedId(null); setRangesText(""); setFilename(""); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSplit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Splitting..." : "Split"}
            </button>
          </div>

          {downloadId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm mb-2">Split complete!</p>
          <a
            href={downloadUrl(downloadId, resultFilename || undefined)}
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
          >
            Download result
          </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
