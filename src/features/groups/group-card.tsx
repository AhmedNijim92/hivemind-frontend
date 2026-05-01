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
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const initials = group.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/groups/${group.groupId}`}
        onClick={onClick}
        className="card p-4 flex items-start gap-3 hover:border-brand-200 dark:hover:border-brand-800 transition-colors block"
      >
        {/* Group avatar */}
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {group.description}
            </p>
          )}

          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
            <Users className="h-3 w-3" />
            <span>{formatNumber(group.memberCount)} members</span>
            <span className="mx-1">·</span>
            <span>{timeAgo(group.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
