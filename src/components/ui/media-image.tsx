"use client";

import { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/utils/cn";

interface MediaImageProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
}

/**
 * Safe image component that handles broken URLs, loading states, and errors.
 * Falls back to a placeholder instead of crashing.
 * Uses native <img> to avoid Next.js Image optimization issues with dynamic URLs.
 */
export function MediaImage({ src, alt = "Media", className }: MediaImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset state when src changes
  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl",
          className
        )}
        style={{ minHeight: 120 }}
      >
        <div className="text-center p-4">
          <ImageOff className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800", className)}>
      {loading && (
        <div className="absolute inset-0 skeleton" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full max-h-96 object-cover rounded-xl transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
      />
    </div>
  );
}
