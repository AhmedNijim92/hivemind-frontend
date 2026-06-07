"use client";

import Link from "next/link";
import { Users, Lock, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatNumber, timeAgo } from "@/utils/format";
import type { GroupDto } from "@/types";

interface GroupCardProps {
  group: GroupDto;
  onClick?: () => void;
  index?: number;
}

export function GroupCard({ group, onClick, index = 0 }: GroupCardProps) {
  const initials = group.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/groups/${group.groupId}`}
        onClick={onClick}
        className="card-hover p-5 flex items-start gap-4 block group/card"
      >
        {/* Group avatar with gradient + hover glow */}
        <motion.div
          whileHover={{ rotate: [0, -3, 3, 0] }}
          transition={{ duration: 0.4 }}
          className="h-13 w-13 rounded-2xl bg-gradient-to-br from-brand-400 via-pink-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20 group-hover/card:shadow-lg group-hover/card:shadow-brand-500/30 transition-shadow"
        >
          <span className="text-white font-bold text-sm">{initials}</span>
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate group-hover/card:text-brand-600 dark:group-hover/card:text-brand-400 transition-colors">
              {group.name}
            </h3>
            <Badge variant={group.privacy === "PUBLIC" ? "default" : "brand"}>
              {group.privacy === "PUBLIC" ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {group.privacy}
            </Badge>
          </div>

          {group.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
              {group.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
            <Users className="h-3 w-3" />
            <span className="font-medium">{formatNumber(group.memberCount)} members</span>
            <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
            <span>{timeAgo(group.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
