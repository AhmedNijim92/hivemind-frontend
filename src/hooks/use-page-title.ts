import { useEffect } from "react";

/**
 * Sets the document title for client-side pages.
 * Format: "Page Title | HiveMind"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | HiveMind`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
