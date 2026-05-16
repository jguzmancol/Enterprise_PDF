import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
export default function PreviewImage({ src, alt, className = "" }) {
    const [loaded, setLoaded] = useState(false);
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { rootMargin: "200px" });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (_jsx("div", { ref: ref, className: className, children: visible ? (_jsx("img", { src: src, alt: alt, onLoad: () => setLoaded(true), className: `w-full h-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}` })) : (_jsx("div", { className: "w-full h-full bg-gray-100 animate-pulse" })) }));
}
