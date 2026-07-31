import { useState } from "react";
import type { MouseEvent } from "react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/merge", label: "Merge", desc: "Combine PDFs into a single document" },
  { to: "/split", label: "Split", desc: "Extract pages into separate PDFs" },
  { to: "/compress", label: "Compress", desc: "Reduce PDF file size" },
  { to: "/office", label: "PDF→Office", desc: "Convert PDF to Word or Excel" },
  { to: "/reorder", label: "Reorder", desc: "Change the page order" },
  { to: "/image-to-pdf", label: "Img→PDF", desc: "Convert images to a PDF" },
  { to: "/watermark", label: "Watermark", desc: "Add a text or image watermark" },
  { to: "/page-numbers", label: "Page numbers", desc: "Add page numbers to every page" },
  { to: "/protect", label: "Protect", desc: "Add or remove a PDF password" },
  { to: "/pdf-to-image", label: "PDF→Image", desc: "Convert pages to PNG or JPG (ZIP)" },
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
          className="fixed z-50 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tip.x, top: tip.y, transform: "translateX(-50%)" }}
        >
          {tip.text}
        </div>
      )}
    </>
  );
}
