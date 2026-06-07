"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Globe, Lock, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUserMemberships, useMyGroups } from "@/hooks/use-groups";
import { useGroupContextStore } from "@/store/group-context-store";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { GroupDto } from "@/types";

const GRADIENTS = [
  "from-violet-600 via-brand-500 to-fuchsia-500",
  "from-blue-600 via-cyan-500 to-teal-400",
  "from-rose-500 via-pink-500 to-orange-400",
  "from-emerald-500 via-green-500 to-lime-400",
  "from-amber-500 via-orange-500 to-red-500",
  "from-indigo-600 via-purple-500 to-pink-500",
  "from-sky-500 via-blue-500 to-indigo-600",
  "from-teal-500 via-emerald-500 to-green-600",
];

function getGradient(i: number) {
  return GRADIENTS[i % GRADIENTS.length];
}

export default function SelectGroupPage() {
  const router = useRouter();
  const { data: memberships, isLoading, error, refetch } = useUserMemberships();
  const { data: ownedGroups } = useMyGroups();
  const { activeGroupId, setActiveGroup } = useGroupContextStore();
  const { openCreateGroup } = useUIStore();
  const { data: currentUser } = useCurrentUser();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // If user already has active group context, redirect to feed
  useEffect(() => {
    if (activeGroupId) {
      router.replace("/feed");
    }
  }, [activeGroupId, router]);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  const hasOwnedGroup = (ownedGroups?.length ?? 0) > 0;

  const handleSelectGroup = (group: GroupDto) => {
    setActiveGroup(group);
    router.push("/feed");
  };

  if (activeGroupId) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-950 dark:via-surface-dark dark:to-brand-950/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="h-16 w-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20"
          >
            <span className="text-white font-bold text-2xl">H</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Select a group to enter
          </p>
        </div>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-6 text-center mb-4"
          >
            <p className="text-red-500 text-sm mb-3">Failed to load your groups</p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <div className="skeleton h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Group list */}
        {!isLoading && !error && (
          <AnimatePresence mode="wait">
            {memberships && memberships.length > 0 ? (
              <motion.div className="space-y-3">
                {memberships.map((membership, i) => (
                  <motion.button
                    key={membership.groupId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectGroup(membership.group)}
                    className="w-full card p-4 flex items-center gap-4 text-left hover:shadow-lg hover:border-brand-200 dark:hover:border-brand-800 transition-all group/item"
                  >
                    {/* Group avatar */}
                    <div className={cn(
                      "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md",
                      getGradient(i)
                    )}>
                      <span className="text-white font-bold text-lg">
                        {membership.group.name[0].toUpperCase()}
                      </span>
                    </div>

                    {/* Group info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover/item:text-brand-600 dark:group-hover/item:text-brand-400 transition-colors">
                          {membership.group.name}
                        </h3>
                        {membership.group.privacy === "PRIVATE" ? (
                          <Lock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatNumber(membership.group.memberCount)} members
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full font-medium">
                          {membership.role}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover/item:text-brand-500 group-hover/item:translate-x-1 transition-all flex-shrink-0" />
                  </motion.button>
                ))}

                {/* Create group button */}
                {!hasOwnedGroup && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: memberships.length * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openCreateGroup}
                    className="w-full card p-4 flex items-center gap-4 text-left border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                        Create a new group
                      </h3>
                      <p className="text-xs text-gray-400">Start your own community</p>
                    </div>
                  </motion.button>
                )}
              </motion.div>
            ) : (
              /* No groups state */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-8 text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                  No groups yet
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                  Create your first group to start connecting with others on HiveMind.
                </p>
                <Button onClick={openCreateGroup}>
                  <Plus className="h-4 w-4" />
                  Create your first group
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
