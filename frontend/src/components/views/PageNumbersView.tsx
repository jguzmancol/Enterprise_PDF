import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import type { FileInfo, TabActions } from "../../types";
import { addPageNumbers } from "../../api/client";
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

const POSITIONS = [
  { v: "bottom-center", label: "Bottom Center" },
  { v: "bottom-left", label: "Bottom Left" },
  { v: "bottom-right", label: "Bottom Right" },
  { v: "top-center", label: "Top Center" },
  { v: "top-left", label: "Top Left" },
  { v: "top-right", label: "Top Right" },
];

function PageNumbersView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }: Props, ref: React.Ref<TabActions>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState("Page {n} of {total}");
  const [position, setPosition] = useState("bottom-center");
  const [fontSize, setFontSize] = useState(10);
  const [startFrom, setStartFrom] = useState(1);
  const [color, setColor] = useState("#000000");

  const selected = files.find((f) => f.id === selectedId);

  useEffect(() => {
    if (files.length > 0) {
      if (!selectedId || !files.find((f) => f.id === selectedId)) {
        setSelectedId(files[0].id);
      }
    }
  }, [files, selectedId]);

  const hexToRgb = (hex: string): number[] => {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const handleAddNumbers = async () => {
    if (!selectedId) return;
    setLoading(true);
    onTabLoadingChange?.(true);
    onTabDownloadIdChange?.(null);
    try {
      const result = await addPageNumbers(selectedId, {
        template,
        position,
        font_size: fontSize,
        start_from: startFrom,
        margin: 40,
        color: hexToRgb(color),
      });
      onTabDownloadIdChange?.(result.download_id);
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "Page numbers failed");
    } finally {
      setLoading(false);
      onTabLoadingChange?.(false);
    }
  };

  useImperativeHandle(ref, () => ({
    action: handleAddNumbers,
    reset: () => setSelectedId(null),
    hasPages: selected != null,
    loading,
  }), [selected, loading, handleAddNumbers]);

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
          Upload a PDF to add page numbers.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Page Numbers</h2>

      {!selected ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Select a file to number:
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

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Template</label>
              <input
                type="text"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Use {"{n}"} for the page number and {"{total}"} for the page count.
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Position</label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((p) => (
                  <button
                    key={p.v}
                    onClick={() => setPosition(p.v)}
                    className={`px-3 py-1 text-sm rounded border transition-colors ${
                      position === p.v
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">Font size</label>
              <input
                type="range"
                min="6"
                max="40"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-sm font-mono w-12 text-right">{fontSize}</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">Start at</label>
              <input
                type="number"
                min="1"
                value={startFrom}
                onChange={(e) => setStartFrom(Number(e.target.value))}
                className="w-20 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default forwardRef(PageNumbersView);
