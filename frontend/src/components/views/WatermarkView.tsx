import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { FileInfo, TabActions } from "../../types";
import { textWatermark, imageWatermark } from "../../api/client";
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

const POSITIONS = ["center", "tile"];

function WatermarkView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }: Props, ref: React.Ref<TabActions>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENCIAL");
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(60);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState("#808080");
  const [position, setPosition] = useState("center");
  const [image, setImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleWatermark = async () => {
    if (!selectedId) return;
    if (mode === "image" && !image) {
      alert("Select a watermark image first");
      return;
    }
    setLoading(true);
    onTabLoadingChange?.(true);
    onTabDownloadIdChange?.(null);
    try {
      const result =
        mode === "text"
          ? await textWatermark(selectedId, {
              text,
              opacity,
              font_size: fontSize,
              color: hexToRgb(color),
              rotation,
              position,
            })
          : await imageWatermark(selectedId, image as File, opacity, position);
      onTabDownloadIdChange?.(result.download_id);
    } catch (e) {
      if (onApiError?.(e)) return;
      alert(e instanceof Error ? e.message : "Watermark failed");
    } finally {
      setLoading(false);
      onTabLoadingChange?.(false);
    }
  };

  useImperativeHandle(ref, () => ({
    action: handleWatermark,
    reset: () => { setSelectedId(null); setImage(null); },
    hasPages: selected != null && (mode === "text" || image != null),
    loading,
  }), [selected, mode, image, loading, handleWatermark]);

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
          Upload a PDF to add a watermark.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 dark:text-gray-100">Watermark</h2>

      {!selected ? (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Select a file to watermark:
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
            <button
              onClick={() => setMode("text")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                mode === "text"
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setMode("image")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                mode === "image"
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"
              }`}
            >
              Image
            </button>
          </div>

          <div className="space-y-4 max-w-md">
            {mode === "text" ? (
              <>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Text</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm"
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
              </>
            ) : (
              <div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {image ? image.name : "Choose watermark image"}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">Opacity</label>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <span className="text-sm font-mono w-12 text-right">{Math.round(opacity * 100)}%</span>
            </div>

            {mode === "text" && (
              <>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">Font size</label>
                  <input
                    type="range"
                    min="12"
                    max="120"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-sm font-mono w-12 text-right">{fontSize}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">Rotation</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-sm font-mono w-12 text-right">{rotation}&deg;</span>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Position</label>
              <div className="flex gap-2">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    className={`px-3 py-1 text-sm rounded border transition-colors ${
                      position === p
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"
                    }`}
                  >
                    {p[0].toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default forwardRef(WatermarkView);
