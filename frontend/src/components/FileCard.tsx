import type { FileInfo } from "../types";
import { previewUrl } from "../api/client";
import PreviewImage from "./PreviewImage";

interface Props {
  file: FileInfo;
  onRemove?: (id: string) => void;
  selected?: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileCard({ file, onRemove, selected }: Props) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 border rounded-lg p-3 flex items-center gap-3 ${
        selected ? "border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/50" : "border-gray-200 dark:border-gray-600"
      }`}
    >
      <div className="w-14 h-18 shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
        <PreviewImage
          src={previewUrl(file.id, 1)}
          alt={file.original_name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate dark:text-gray-200">{file.original_name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {file.page_count} page{file.page_count !== 1 ? "s" : ""} &middot;{" "}
          {formatSize(file.size_bytes)}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(file.id)}
          className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 text-lg leading-none px-1"
          title="Remove"
        >
          &times;
        </button>
      )}
    </div>
  );
}
