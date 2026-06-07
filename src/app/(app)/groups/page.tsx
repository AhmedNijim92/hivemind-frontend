"use client";

import { Plus, Users } from "lucide-react";
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

  const hasOwnedGroup = (ownedGroups?.length ?? 0) > 0;
  const groups = memberships?.map((m) => m.group) ?? [];

  return (
    <>
      <TopBar title="Groups" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Groups
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {groups.length} groups
            </p>
          </div>
          {!hasOwnedGroup && (
            <Button onClick={openCreateGroup}>
              <Plus className="h-4 w-4" />
              New Group
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <GroupCardSkeleton key={i} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            emoji="🐝"
            title="No groups yet"
            description="Create or join a group to start connecting with others."
            actionLabel="Create your first group"
            onAction={openCreateGroup}
          />
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard key={group.groupId} group={group} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
