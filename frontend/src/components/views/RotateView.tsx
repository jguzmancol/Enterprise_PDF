import { useState } from "react";
import type { FileInfo } from "../../types";
import { rotatePage, reorderFile, previewUrl, downloadUrl } from "../../api/client";
import FileCard from "../FileCard";
import PreviewImage from "../PreviewImage";

interface Props {
  files: FileInfo[];
  thumbnailSize?: number;
}

export default function RotateView({ files, thumbnailSize }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageVersions, setPageVersions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [filename, setFilename] = useState("");

  const selected = files.find((f) => f.id === selectedId);

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

  const handleDownload = async () => {
    if (!selectedId || !selected) return;
    setLoading(true);
    setDownloadId(null);
    try {
      const order = Array.from({ length: selected.page_count }, (_, i) => i + 1);
      const result = await reorderFile(selectedId, order);
      setDownloadId(result.download_id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  if (files.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Upload a PDF to rotate its pages.
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Rotate PDF</h2>

      {!selected ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Select a file to rotate:</p>
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className="cursor-pointer"
              >
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

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Click the circle on any page to rotate it 90&deg; clockwise.
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[60vh] overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
            {Array.from({ length: selected.page_count }, (_, i) => i + 1).map(
              (pageNum) => (
                <div
                  key={pageNum}
                  className="relative border border-gray-200 dark:border-gray-600 rounded-lg p-1"
                >
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-0.5 text-center">
                    {pageNum}
                  </div>
                  <div className="relative">
                    <PreviewImage
                      src={getPreviewSrc(pageNum)}
                      alt={`Page ${pageNum}`}
                      size={thumbnailSize}
                    />
                    <button
                      onClick={() => handleRotate(pageNum)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shadow-sm transition-colors"
                      title="Rotate 90°"
                    >
                      &#8635;
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4 mb-1">
            Output filename
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="rotated.pdf"
            className="w-full max-w-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setSelectedId(null); setPageVersions({}); setFilename(""); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Preparing..." : "Download rotated PDF"}
            </button>
          </div>

          {downloadId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm mb-2">Done!</p>
          <a
            href={downloadUrl(downloadId, filename || undefined)}
            download
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
          >
            Download rotated PDF
          </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
