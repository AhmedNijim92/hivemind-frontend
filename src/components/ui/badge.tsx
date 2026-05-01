import { cn } from "@/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
        brand: "bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300",
        success: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
        warning: "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
        danger: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300",
        active: "bg-green-500 text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
