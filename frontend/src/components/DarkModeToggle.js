import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function DarkModeToggle() {
    const [dark, setDark] = useState(() => {
        if (typeof window === "undefined")
            return false;
        const stored = localStorage.getItem("dark");
        if (stored !== null)
            return stored === "true";
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });
    useEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
        localStorage.setItem("dark", String(dark));
    }, [dark]);
    return (_jsx("button", { onClick: () => setDark((d) => !d), className: "w-7 h-7 flex items-center justify-center text-sm rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", title: dark ? "Light mode" : "Dark mode", children: dark ? "\u2600" : "\u263E" }));
}
