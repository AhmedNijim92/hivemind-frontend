"use client";

import { Plus, Users, Search } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { GroupCard } from "@/features/groups/group-card";
import { GroupCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useMyGroups, useUserMemberships } from "@/hooks/use-groups";
import { useUIStore } from "@/store/ui-store";
import { usePageTitle } from "@/hooks/use-page-title";

export default function GroupsPage() {
  usePageTitle("Groups");
  const { data: memberships, isLoading } = useUserMemberships();
  const { data: ownedGroups } = useMyGroups();
  const openCreateGroup = useUIStore((s) => s.openCreateGroup);
  const [search, setSearch] = useState("");

  const hasOwnedGroup = (ownedGroups?.length ?? 0) > 0;
  const allGroups = memberships?.map((m) => m.group) ?? [];
  const groups = search
    ? allGroups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : allGroups;

  return (
    <>
      <TopBar title="Groups" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden lg:block">Groups</h1>
            <p className="text-gray-400 text-sm hidden lg:block mt-0.5">{allGroups.length} group{allGroups.length !== 1 ? "s" : ""}</p>
          </div>
          {!hasOwnedGroup && (
            <Button onClick={openCreateGroup} size="sm">
              <Plus className="h-4 w-4" /> Create
            </Button>
          )}
        </motion.div>

        {/* Search */}
        {allGroups.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10 transition-all"
            />
          </div>
        )}

        {/* Groups list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <GroupCardSkeleton key={i} />)}
          </div>
        ) : groups.length === 0 && search ? (
          <EmptyState emoji="🔍" title="No results" description={`No groups matching "${search}"`} />
        ) : groups.length === 0 ? (
          <EmptyState
            emoji="🐝"
            title="No groups yet"
            description="Create or join a group to start connecting."
            actionLabel="Create your first group"
            onAction={openCreateGroup}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            {groups.map((group, i) => (
              <GroupCard key={group.groupId} group={group} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}
