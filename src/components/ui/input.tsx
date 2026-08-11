"use client";

import { forwardRef, useState } from "react";
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
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium transition-colors",
              focused ? "text-brand-500" : "text-gray-700 dark:text-gray-300"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className={cn(
                "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors",
                focused ? "text-brand-500" : "text-gray-400"
              )}
            >
              {icon}
            </div>
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
          {/* Focus ring */}
          {focused && !error && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none ring-2 ring-brand-500/20"
            />
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
