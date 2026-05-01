import Image from "next/image";
import { cn } from "@/utils/cn";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-14 w-14 text-xl",
  xl: "h-20 w-20 text-2xl",
};

const pixelMap = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getColor(name?: string) {
  const colors = [
    "bg-brand-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const px = pixelMap[size];

  if (src) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden flex-shrink-0",
          sizeMap[size],
          className
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
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white",
        sizeMap[size],
        getColor(name),
        className
      )}
      aria-label={name ?? "avatar"}
    >
      {getInitials(name)}
    </div>
  );
}
