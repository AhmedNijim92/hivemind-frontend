"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showGradientRing?: boolean;
  online?: boolean;
}

const sizeMap = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-14 w-14 text-xl",
  xl: "h-20 w-20 text-2xl",
};

const pixelMap = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };

const ringSize = {
  xs: "p-[1.5px]",
  sm: "p-[2px]",
  md: "p-[2px]",
  lg: "p-[2.5px]",
  xl: "p-[3px]",
};

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getGradient(name?: string) {
  const gradients = [
    "from-brand-400 to-brand-600",
    "from-blue-400 to-indigo-600",
    "from-emerald-400 to-teal-600",
    "from-orange-400 to-rose-600",
    "from-pink-400 to-purple-600",
    "from-cyan-400 to-blue-600",
  ];
  if (!name) return gradients[0];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

export function Avatar({ src, name, size = "md", className, showGradientRing, online }: AvatarProps) {
  const px = pixelMap[size];
  const gradient = getGradient(name);

  const avatarContent = src ? (
    <div
      className={cn(
        "relative rounded-full overflow-hidden flex-shrink-0",
        sizeMap[size],
      )}
    >
      <Image
        src={src}
        alt={name ?? "avatar"}
        width={px}
        height={px}
        className="object-cover w-full h-full"
      />
    </div>
  ) : (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white bg-gradient-to-br",
        sizeMap[size],
        gradient,
      )}
      aria-label={name ?? "avatar"}
    >
      {getInitials(name)}
    </div>
  );

  if (showGradientRing) {
    return (
      <div className={cn("relative inline-flex", className)}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={cn(
            "rounded-full bg-gradient-to-br from-brand-400 via-pink-500 to-indigo-500",
            ringSize[size],
            "animate-spin-slow"
          )}
          style={{ animationDuration: "4s" }}
        >
          <div className="rounded-full bg-white dark:bg-surface-dark p-[2px]">
            {avatarContent}
          </div>
        </motion.div>
        {online && (
          <span className={cn(
            "online-dot absolute bottom-0 right-0",
            size === "xs" && "h-2 w-2",
            size === "sm" && "h-2.5 w-2.5",
          )} />
        )}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn("relative inline-flex flex-shrink-0", className)}
    >
      {avatarContent}
      {online && (
        <span className={cn(
          "online-dot absolute bottom-0 right-0",
          size === "xs" && "h-2 w-2",
          size === "sm" && "h-2.5 w-2.5",
        )} />
      )}
    </motion.div>
  );
}
