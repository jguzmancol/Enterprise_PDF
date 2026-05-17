import { useRef, useState, type DragEvent } from "react";

interface Props {
  onUpload: (files: FileList | File[]) => void;
  accept?: string;
  label?: string;
  hint?: string;
}

export default function FileDropzone({
  onUpload,
  accept = ".pdf",
  label = "Drag & drop PDF files here, or click to browse",
  hint = "Max 100 MB per file",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files);
  };

  const handleChange = () => {
    if (inputRef.current?.files?.length) onUpload(inputRef.current.files);
  };

  if (collapsed) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-4">
        <button
          onClick={() => setCollapsed(false)}
          className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Show upload area"
        >
          &#9650;
        </button>
        <span>Upload files</span>
        <button
          onClick={() => inputRef.current?.click()}
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
        >
          Browse
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors relative ${
        dragging
          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
          : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xs"
        title="Collapse"
      >
        &#9660;
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-gray-600 dark:text-gray-300 font-medium">
        {label}
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{hint}</p>
    </div>
  );
}
