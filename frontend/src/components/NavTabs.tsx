import { useState } from "react";
import type { MouseEvent } from "react";
import { NavLink } from "react-router-dom";

const tabs = [
  {
    to: "/merge",
    label: "Merge",
    desc: "Combine PDFs into one document. Accepts .pdf files. Upload files, drag to set the order, then click \"Merge pages\".",
  },
  {
    to: "/split",
    label: "Split",
    desc: "Extract page ranges from a PDF into separate files. Accepts .pdf. Enter ranges like 1-3, then click \"Split PDF\".",
  },
  {
    to: "/compress",
    label: "Compress",
    desc: "Reduce the size of a PDF. Accepts .pdf. Pick a compression level (Min to Max), then click \"Compress\".",
  },
  {
    to: "/office",
    label: "PDF→Office",
    desc: "Convert a PDF to Word (.docx) or Excel (.xlsx). Accepts .pdf. Choose the format, then click \"Convert\".",
  },
  {
    to: "/reorder",
    label: "Reorder",
    desc: "Change the page order of a PDF. Accepts .pdf. Drag the page thumbnails, then click \"Apply new order\".",
  },
  {
    to: "/image-to-pdf",
    label: "Img→PDF",
    desc: "Convert images (PNG, JPG, WebP, BMP, TIFF) into a PDF. Upload the images and download the result.",
  },
  {
    to: "/watermark",
    label: "Watermark",
    desc: "Add a text or image watermark over a PDF. Accepts .pdf. Choose text or an image, set the opacity, then click \"Add watermark\".",
  },
  {
    to: "/page-numbers",
    label: "Page numbers",
    desc: "Add page numbers to a PDF. Accepts .pdf. Set the template and position, then click \"Add numbers\".",
  },
  {
    to: "/protect",
    label: "Protect",
    desc: "Protect a PDF with a password (AES-256) or remove its password. Accepts .pdf. Enter the password, then click \"Apply\".",
  },
  {
    to: "/pdf-to-image",
    label: "PDF→Image",
    desc: "Convert a PDF's pages to PNG or JPG images inside a ZIP. Accepts .pdf. Pick the format and DPI, then click \"Convert to images\".",
  },
];

interface Tip {
  text: string;
  x: number;
  y: number;
}

export default function NavTabs() {
  const [tip, setTip] = useState<Tip | null>(null);

  const showTip = (e: MouseEvent<HTMLAnchorElement>, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              onMouseEnter={(e) => showTip(e, t.desc)}
              onMouseLeave={() => setTip(null)}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
      {tip && (
        <div
          className="fixed z-50 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg pointer-events-none max-w-[280px] leading-snug"
          style={{ left: tip.x, top: tip.y, transform: "translateX(-50%)" }}
        >
          {tip.text}
        </div>
      )}
    </>
  );
}
