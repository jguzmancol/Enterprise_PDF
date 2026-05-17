import type { ReactNode } from "react";
import type { FileInfo } from "../types";
import NavTabs from "./NavTabs";
import DarkModeToggle from "./DarkModeToggle";

interface Props {
  files: FileInfo[];
  onClearFiles: () => void;
  thumbnailSize: number;
  onThumbnailSizeChange: (size: number) => void;
  children: ReactNode;
}

export default function Layout({
  files,
  onClearFiles,
  thumbnailSize,
  onThumbnailSizeChange,
  children,
}: Props) {
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

      <main className="flex-1 min-h-0 overflow-y-auto p-5">
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
