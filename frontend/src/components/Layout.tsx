import type { ReactNode } from "react";
import type { FileInfo } from "../types";
import NavTabs from "./NavTabs";
import FileDropzone from "./FileDropzone";
import FilePageGrid from "./FilePageGrid";
import DarkModeToggle from "./DarkModeToggle";

interface Props {
  files: FileInfo[];
  onUpload: (files: FileList | File[]) => void;
  error: string | null;
  onClearFiles: () => void;
  onRemoveFile: (id: string) => void;
  children: ReactNode;
}

export default function Layout({
  files,
  onUpload,
  error,
  onClearFiles,
  onRemoveFile,
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

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <aside className="md:w-96 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
          <div className="p-5 pb-0 shrink-0">
            <FileDropzone onUpload={onUpload} />

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 p-5 pt-4">
            <FilePageGrid files={files} onRemove={onRemoveFile} />
          </div>
        </aside>

        <main className="flex-1 p-5 min-w-0 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
