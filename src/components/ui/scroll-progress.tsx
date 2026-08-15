"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

/**
 * Thin progress bar at the top of the viewport showing scroll position.
 * Adds a premium feel to long-scroll pages.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const smoothProgress = useSpring(0, { stiffness: 100, damping: 20 });

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const p = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setProgress(p);
      smoothProgress.set(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [smoothProgress]);

  if (progress < 0.02) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-gradient-brand origin-left"
      style={{ scaleX: smoothProgress }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    />
  );
}
