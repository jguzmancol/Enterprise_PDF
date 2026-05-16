import { useRef, useState, type DragEvent } from "react";

interface Props {
  onUpload: (files: FileList | File[]) => void;
}

export default function FileDropzone({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files);
  };

  const handleChange = () => {
    if (inputRef.current?.files?.length) onUpload(inputRef.current.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging
          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
          : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-gray-600 dark:text-gray-300 font-medium">
        Drag & drop PDF files here, or click to browse
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Max 100 MB per file</p>
    </div>
  );
}
