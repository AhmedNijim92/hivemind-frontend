"use client";

import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, onFocus, onBlur, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const [focused, setFocused] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <motion.label
            htmlFor={inputId}
            animate={{
              color: focused ? "rgb(168, 85, 247)" : undefined,
            }}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          {icon && (
            <motion.div
              animate={{ color: focused ? "rgb(168, 85, 247)" : undefined }}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
            >
              {icon}
            </motion.div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input-base",
              icon && "pl-11",
              error && "border-red-400/60 focus:ring-red-400/40 focus:border-red-400/60",
              className
            )}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          {/* Animated focus border glow */}
          {focused && !error && (
            <motion.div
              layoutId="input-glow"
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.1), 0 0 20px -5px rgba(168, 85, 247, 0.15)",
                borderRadius: "0.75rem",
              }}
            />
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 font-medium"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p className="text-xs text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
