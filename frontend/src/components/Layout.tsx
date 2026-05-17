import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import type { FileInfo } from "../types";
import NavTabs from "./NavTabs";
import FileDropzone from "./FileDropzone";
import DarkModeToggle from "./DarkModeToggle";

interface Props {
  files: FileInfo[];
  onUpload: (files: FileList | File[]) => void;
  error: string | null;
  onClearFiles: () => void;
  thumbnailSize: number;
  onThumbnailSizeChange: (size: number) => void;
  useSharedFiles: boolean;
  onToggleSharedFiles: (v: boolean) => void;
  multiple?: boolean;
  children: ReactNode;
}

export default function Layout({
  files,
  onUpload,
  error,
  onClearFiles,
  thumbnailSize,
  onThumbnailSizeChange,
  useSharedFiles,
  onToggleSharedFiles,
  multiple = true,
  children,
}: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showOptions]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0 relative">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            PDF Tool
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setShowOptions((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-lg"
                title="General options"
              >
                &#9881;
              </button>

              {showOptions && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    General Options
                  </h3>
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Shared files
                      </span>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {useSharedFiles
                          ? "Upload from any tab, visible in all"
                          : "Each tab has its own independent files"}
                      </p>
                    </div>
                    <button
                      onClick={() => onToggleSharedFiles(!useSharedFiles)}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        useSharedFiles
                          ? "bg-blue-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          useSharedFiles ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>
                </div>
              )}
            </div>

            <DarkModeToggle />
            {files.length > 0 && (
              <button
                onClick={onClearFiles}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Clear files ({files.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <NavTabs />

      <main className="flex-1 min-h-0 overflow-y-auto p-5">
        {useSharedFiles && (
          <div className="mb-4">
            <FileDropzone onUpload={onUpload} multiple={multiple} />
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 sticky top-0 bg-gray-50 dark:bg-gray-900 pb-2 z-10">
          <span>Previews:</span>
          <button
            onClick={() => onThumbnailSizeChange(Math.max(50, thumbnailSize - 10))}
            disabled={thumbnailSize <= 50}
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
          >
            &minus;
          </button>
          <span className="w-8 text-center text-xs font-mono">{thumbnailSize}px</span>
          <button
            onClick={() => onThumbnailSizeChange(Math.min(250, thumbnailSize + 10))}
            disabled={thumbnailSize >= 250}
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
          >
            +
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
