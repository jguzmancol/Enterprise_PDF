import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/merge", label: "Merge" },
  { to: "/split", label: "Split" },
  { to: "/compress", label: "Compress" },
  { to: "/office", label: "PDF→Office" },
  { to: "/reorder", label: "Reorder" },
  { to: "/image-to-pdf", label: "Img→PDF" },
];

export default function NavTabs() {
  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-6 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
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
  );
}
