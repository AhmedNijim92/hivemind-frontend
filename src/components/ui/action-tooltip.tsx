"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ActionTooltipProps {
  show: boolean;
  text: string;
  emoji?: string;
}

/**
 * A brief floating tooltip that appears near an action (like double-tap to like).
 * Disappears after a moment with a smooth animation.
 */
export function ActionTooltip({ show, text, emoji }: ActionTooltipProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/80 dark:bg-white/10 backdrop-blur-md text-white text-xs font-medium whitespace-nowrap shadow-lg z-50"
        >
          {emoji && <span className="mr-1">{emoji}</span>}
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
