import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  aspectRatio?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  wrapperClassName?: string;
}

export function LazyImage({
  src,
  alt,
  fallback,
  aspectRatio,
  objectFit = "cover",
  wrapperClassName,
  className,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const displaySrc = error && fallback ? fallback : src;

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden bg-white/[0.04]",
        aspectRatio && `aspect-[${aspectRatio}]`,
        wrapperClassName
      )}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-white/[0.06]" />
      )}

      {inView && (
        <img
          {...props}
          src={displaySrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            setLoaded(true);
          }}
          className={cn(
            "transition-opacity duration-300 w-full h-full",
            `object-${objectFit}`,
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}

      {error && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono text-white/20">
            Image unavailable
          </span>
        </div>
      )}
    </div>
  );
}
