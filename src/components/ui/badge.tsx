"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
  {
    variants: {
      variant: {
        default: "bg-gray-100/80 dark:bg-white/[0.05] border-gray-200/50 dark:border-white/[0.06] text-gray-700 dark:text-gray-300",
        brand: "bg-brand-50 dark:bg-brand-950/40 border-brand-200/50 dark:border-brand-800/30 text-brand-700 dark:text-brand-300",
        success: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300",
        warning: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-300",
        danger: "bg-red-50 dark:bg-red-950/40 border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-300",
        active: "bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent text-white shadow-sm shadow-emerald-500/25",
        gradient: "bg-gradient-brand border-transparent text-white shadow-sm shadow-brand-500/25",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  animate?: boolean;
}

export function Badge({ className, variant, animate = false, ...props }: BadgeProps) {
  if (animate) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={cn(badgeVariants({ variant }), className)}
        {...(props as any)}
      />
    );
  }

  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
