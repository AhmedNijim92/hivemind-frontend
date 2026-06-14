"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Lock, Globe, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { formatNumber, timeAgo } from "@/utils/format";
import type { GroupDto } from "@/types";

interface GroupCardProps {
  group: GroupDto;
  onClick?: () => void;
  index?: number;
}

const gradients = [
  "from-brand-400 to-brand-600",
  "from-pink-400 to-rose-600",
  "from-indigo-400 to-purple-600",
  "from-emerald-400 to-teal-600",
  "from-orange-400 to-red-500",
  "from-cyan-400 to-blue-600",
];

export function GroupCard({ group, onClick, index = 0 }: GroupCardProps) {
  const gradient = gradients[group.name.charCodeAt(0) % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/groups/${group.groupId}`}
        onClick={onClick}
        className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] hover:border-brand-200 dark:hover:border-brand-500/20 hover:shadow-md hover:shadow-brand-500/5 transition-all duration-200 group/card"
      >
        {/* Group avatar */}
        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover/card:shadow-md group-hover/card:scale-105 transition-all duration-200 overflow-hidden relative`}>
          {group.profilePictureUrl ? (
            <Image src={group.profilePictureUrl} alt={group.name} fill className="object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">{group.name[0].toUpperCase()}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-[15px] truncate group-hover/card:text-brand-600 dark:group-hover/card:text-brand-400 transition-colors">
              {group.name}
            </h3>
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
              group.privacy === "PUBLIC"
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
              {group.privacy === "PUBLIC" ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
              {group.privacy === "PUBLIC" ? "Open" : "Private"}
            </span>
          </div>

          {group.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{group.description}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Users className="h-3 w-3" /> {formatNumber(group.memberCount)} members
            </span>
            <span className="text-[11px] text-gray-300 dark:text-gray-600">
              {timeAgo(group.createdAt)}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover/card:text-brand-400 group-hover/card:translate-x-0.5 transition-all flex-shrink-0" />
      </Link>
    </motion.div>
  );
}
