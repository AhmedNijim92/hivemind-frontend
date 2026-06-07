"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm tracking-button transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-dark disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/30 focus-visible:ring-brand-400 btn-shimmer",
        secondary:
          "bg-gray-100 hover:bg-gray-200 dark:bg-surface-dark-3 dark:hover:bg-surface-dark-4 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-white/[0.06] shadow-sm hover:shadow-md focus-visible:ring-gray-400",
        ghost:
          "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/[0.04] focus-visible:ring-gray-400",
        danger:
          "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 focus-visible:ring-red-400",
        outline:
          "border border-gray-200 dark:border-white/[0.1] hover:bg-gray-50 dark:hover:bg-white/[0.03] text-gray-900 dark:text-gray-100 shadow-sm focus-visible:ring-gray-400",
        gradient:
          "bg-gradient-brand text-white shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/35 focus-visible:ring-brand-400 btn-shimmer",
      },
      size: {
        sm: "px-3 py-1.5 text-xs rounded-lg",
        md: "px-5 py-2.5",
        lg: "px-7 py-3.5 text-base",
        icon: "p-2.5 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  )
);
Button.displayName = "Button";
