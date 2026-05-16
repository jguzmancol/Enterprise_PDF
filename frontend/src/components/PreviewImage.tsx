import { useState, useRef, useEffect } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  size?: number;
}

export default function PreviewImage({ src, alt, className = "", size }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const wrapperStyle = size
    ? { width: size, height: Math.round(size * 4 / 3), minWidth: size }
    : undefined;

  return (
    <div
      ref={ref}
      className={className}
      style={wrapperStyle}
    >
      {visible ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 animate-pulse" />
      )}
    </div>
  );
}
