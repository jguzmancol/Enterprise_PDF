import { useState } from "react";
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
  children: ReactNode;
}

export default function Layout({
  files,
  onUpload,
  error,
  onClearFiles,
  thumbnailSize,
  onThumbnailSizeChange,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            PDF Tool
          </h1>
          <div className="flex items-center gap-3">
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

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <aside
          className={`${
            sidebarOpen ? "md:w-96" : "md:w-0"
          } shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0 transition-all duration-200 overflow-hidden`}
        >
          <div className="flex items-center justify-end pt-2 pr-2 shrink-0">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Close sidebar"
            >
              &#x2715;
            </button>
          </div>
          <div className="p-5 pt-0 shrink-0">
            <FileDropzone onUpload={onUpload} />

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Previews:</span>
              <button
                onClick={() => onThumbnailSizeChange(Math.max(50, thumbnailSize - 10))}
                disabled={thumbnailSize <= 50}
                className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                &minus;
              </button>
              <span className="w-8 text-center text-xs font-mono">{thumbnailSize}</span>
              <button
                onClick={() => onThumbnailSizeChange(Math.min(250, thumbnailSize + 10))}
                disabled={thumbnailSize >= 250}
                className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </aside>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 w-6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="Open sidebar"
          >
            &#x25B6;
          </button>
        )}

        <main className="flex-1 p-5 min-w-0 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
