import { useRef, useState, type DragEvent } from "react";

const MAX_BYTES = 20 * 1024 * 1024;

function PremiumModal({ fileName, onClose }: { fileName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">{String.fromCharCode(128274)}</div>
        <h3 className="text-xl font-bold mb-2 dark:text-gray-100">
          File exceeds free limit
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
          <span className="font-semibold break-all">{fileName}</span> is larger
          than 20 MB. To process files up to 100 MB, please acquire the premium
          service.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-5">
          Contact us at{" "}
          <a
            href="mailto:enterprisepdf@jgfx.pro"
            className="text-blue-500 hover:underline"
          >
            enterprisepdf@jgfx.pro
          </a>{" "}
          for subscription plans.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

interface Props {
  onUpload: (files: FileList | File[]) => void;
  accept?: string;
  label?: string;
  hint?: string;
  multiple?: boolean;
}

export default function FileDropzone({
  onUpload,
  accept = ".pdf",
  multiple = true,
  label = multiple
    ? "Drag & drop PDF files here, or click to browse"
    : "Drag & drop a PDF file here, or click to browse",
  hint = "Max 20 MB per file",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [oversizeName, setOversizeName] = useState("");

  const checkSize = (files: FileList | File[]) => {
    for (const f of Array.from(files as Iterable<File>)) {
      if (f.size > MAX_BYTES) {
        setOversizeName(f.name);
        setShowPremiumModal(true);
        return false;
      }
    }
    return true;
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0 && checkSize(e.dataTransfer.files)) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleChange = () => {
    if (inputRef.current?.files?.length && checkSize(inputRef.current.files)) {
      onUpload(inputRef.current.files);
    }
  };

  if (collapsed) {
    return (
      <>
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
            multiple={multiple}
            onChange={handleChange}
            className="hidden"
          />
        </div>
        {showPremiumModal && <PremiumModal fileName={oversizeName} onClose={() => setShowPremiumModal(false)} />}
      </>
    );
  }

  return (
    <>
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
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          {label}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{hint}</p>
      </div>
      {showPremiumModal && <PremiumModal fileName={oversizeName} onClose={() => setShowPremiumModal(false)} />}
    </>
  );
}
