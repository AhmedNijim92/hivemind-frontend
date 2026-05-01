"use client";

import { motion } from "framer-motion";

/**
 * Full-screen loading indicator with HiveMind branding.
 */
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="h-14 w-14 rounded-2xl bg-brand-500 flex items-center justify-center"
      >
        <span className="text-white font-bold text-xl">H</span>
      </motion.div>
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
