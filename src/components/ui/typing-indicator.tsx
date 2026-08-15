"use client";

import { motion } from "framer-motion";

/**
 * Animated typing indicator — three bouncing dots.
 */
export function TypingIndicator({ name }: { name?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-md">
        <motion.span
          className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
        />
        <motion.span
          className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        />
      </div>
      {name && (
        <span className="text-xs text-gray-400">{name} is typing…</span>
      )}
    </motion.div>
  );
}
