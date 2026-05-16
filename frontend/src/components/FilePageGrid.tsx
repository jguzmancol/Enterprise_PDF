import { useState } from "react";
import type { FileInfo } from "../types";
import { previewUrl } from "../api/client";
import PreviewImage from "./PreviewImage";

interface Props {
  files: FileInfo[];
  onRemove?: (id: string) => void;
}

const MIN = 80;
const MAX = 300;
const STEP = 20;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePageGrid({ files, onRemove }: Props) {
  const [thumbWidth, setThumbWidth] = useState(180);

  const zoomIn = () => setThumbWidth((w) => Math.min(w + STEP, MAX));
  const zoomOut = () => setThumbWidth((w) => Math.max(w - STEP, MIN));
  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fill, ${thumbWidth}px)`,
    justifyContent: "center",
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-6 space-y-6">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {file.original_name}
              </p>
              <p className="text-xs text-gray-500">
                {file.page_count} page{file.page_count !== 1 ? "s" : ""}
                &middot; {formatSize(file.size_bytes)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                disabled={thumbWidth <= MIN}
                className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                title="Zoom out"
              >
                &minus;
              </button>
              <span className="text-xs text-gray-400 w-8 text-center">
                {thumbWidth}px
              </span>
              <button
                onClick={zoomIn}
                disabled={thumbWidth >= MAX}
                className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                title="Zoom in"
              >
                +
              </button>
              {onRemove && (
                <button
                  onClick={() => onRemove(file.id)}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 text-lg leading-none ml-2 transition-colors"
                  title="Remove"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-2" style={gridStyle}>
            {Array.from({ length: file.page_count }, (_, i) => i + 1).map(
              (pageNum) => (
                <div
                  key={pageNum}
                  className="border border-gray-200 rounded-lg p-1"
                >
                  <PreviewImage
                    src={previewUrl(file.id, pageNum)}
                    alt={`${file.original_name} - page ${pageNum}`}
                    className="aspect-[5/7] w-full"
                  />
                  <span className="block text-[10px] text-center text-gray-400 mt-0.5">
                    {pageNum}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
