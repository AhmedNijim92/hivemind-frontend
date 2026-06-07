"use client";

import { Users, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGroupContextStore } from "@/store/group-context-store";
import { cn } from "@/utils/cn";

/**
 * Persistent banner showing the active group name above user identity.
 * Includes a "Switch Group" action button.
 */
export function ActiveGroupBanner({ className }: { className?: string }) {
  const router = useRouter();
  const activeGroup = useGroupContextStore((s) => s.activeGroup);
  const clearActiveGroup = useGroupContextStore((s) => s.clearActiveGroup);

  if (!activeGroup) return null;

  const handleSwitchGroup = () => {
    clearActiveGroup();
    router.push("/select-group");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50/80 dark:bg-brand-950/20 border border-brand-100/50 dark:border-brand-800/20",
        className
      )}
    >
      <div className="h-7 w-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-xs">
          {activeGroup.name[0].toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 truncate">
          {activeGroup.name}
        </p>
        <p className="text-[10px] text-brand-500/70 dark:text-brand-400/70 flex items-center gap-1">
          <Users className="h-2.5 w-2.5" />
          Active group
        </p>
      </div>

      <button
        onClick={handleSwitchGroup}
        className="p-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
        aria-label="Switch group"
        title="Switch group"
      >
        <ArrowLeftRight className="h-3.5 w-3.5 text-brand-500" />
      </button>
    </motion.div>
  );
}
