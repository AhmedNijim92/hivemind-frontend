"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Users, Rss, ChevronRight, Globe, Lock, MessageCircle, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { PostCard } from "@/features/posts/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMyGroups } from "@/hooks/use-groups";
import { useGroupPosts } from "@/hooks/use-posts";
import { useCurrentUser } from "@/hooks/use-user";
import { useUIStore } from "@/store/ui-store";
import { usePageTitle } from "@/hooks/use-page-title";
import { StoriesBar } from "@/features/stories/stories-bar";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";
import type { GroupDto } from "@/types";

const GRADIENTS = [
  { bg: "from-violet-600 via-brand-500 to-fuchsia-500", light: "from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30" },
  { bg: "from-blue-600 via-cyan-500 to-teal-400", light: "from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30" },
  { bg: "from-rose-500 via-pink-500 to-orange-400", light: "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30" },
  { bg: "from-emerald-500 via-green-500 to-lime-400", light: "from-emerald-50 to-lime-50 dark:from-emerald-950/30 dark:to-lime-950/30" },
  { bg: "from-amber-500 via-orange-500 to-red-500", light: "from-amber-50 to-red-50 dark:from-amber-950/30 dark:to-red-950/30" },
  { bg: "from-indigo-600 via-purple-500 to-pink-500", light: "from-indigo-50 to-pink-50 dark:from-indigo-950/30 dark:to-pink-950/30" },
  { bg: "from-sky-500 via-blue-500 to-indigo-600", light: "from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30" },
  { bg: "from-teal-500 via-emerald-500 to-green-600", light: "from-teal-50 to-green-50 dark:from-teal-950/30 dark:to-green-950/30" },
];

function getGradient(i: number) { return GRADIENTS[i % GRADIENTS.length]; }

/* ─── Group Feed ─────────────────────────────────────────────────────────── */

function GroupFeed({ groupId }: { groupId: string }) {
  const { data: posts, isLoading } = useGroupPosts(groupId);
  const batchSize = 10;
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  useEffect(() => { if (inView && posts && visibleCount < posts.length) setVisibleCount((p) => Math.min(p + batchSize, posts.length)); }, [inView, posts, visibleCount]);
  useEffect(() => { setVisibleCount(batchSize); }, [groupId]);

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}</div>;
  if (!posts?.length) return <EmptyState emoji="📝" title="No posts yet" description="Be the first to share something!" />;

  return (
    <div className="space-y-4">
      {posts.slice(0, visibleCount).map((post) => <PostCard key={post.postId} post={post} />)}
      {visibleCount < posts.length && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

/* ─── Group Card ─────────────────────────────────────────────────────────── */

function GroupCard({ group, index, isSelected, onSelect }: {
  group: GroupDto; index: number; isSelected: boolean; onSelect: () => void;
}) {
  const grad = getGradient(index);

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      role="tab"
      aria-selected={isSelected}
      className={cn(
        "flex-shrink-0 w-[170px] sm:w-[190px] rounded-2xl overflow-hidden text-left transition-all duration-300 relative",
        isSelected
          ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark shadow-xl shadow-brand-500/10"
          : "shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-800"
      )}
    >
      {/* Gradient header */}
      <div className={cn("h-20 relative bg-gradient-to-br", grad.bg)}>
        {/* Animated pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-3 h-12 w-12 rounded-full bg-white/20 blur-lg" />
          <div className="absolute bottom-1 left-2 h-8 w-8 rounded-full bg-white/15 blur-md" />
        </div>

        {/* Group initial — large, centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/90 font-black text-3xl tracking-tight drop-shadow-md">
            {group.name[0].toUpperCase()}
          </span>
        </div>

        {/* Privacy badge */}
        <div className="absolute top-2 right-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
            {group.privacy === "PRIVATE" ? <Lock className="h-2.5 w-2.5 text-white" /> : <Globe className="h-2.5 w-2.5 text-white" />}
          </div>
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 left-2 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-md"
          >
            <Sparkles className="h-3 w-3 text-brand-500" />
          </motion.div>
        )}
      </div>

      {/* Info section */}
      <div className={cn("p-3 bg-white dark:bg-surface-dark-2", isSelected && cn("bg-gradient-to-b", grad.light))}>
        <p className={cn(
          "text-sm font-bold truncate",
          isSelected ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-gray-100"
        )}>
          {group.name}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Users className="h-3 w-3" />
            {formatNumber(group.memberCount)}
          </span>
          {group.description && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <FileText className="h-3 w-3" />
              Active
            </span>
          )}
        </div>

        {/* Description preview */}
        {group.description && (
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{group.description}</p>
        )}
      </div>
    </motion.button>
  );
}

/* ─── Feed Page ──────────────────────────────────────────────────────────── */

export default function FeedPage() {
  usePageTitle("Feed");
  const { data: groups, isLoading: groupsLoading } = useMyGroups();
  const { data: currentUser } = useCurrentUser();
  const { activeGroupId, setActiveGroupId, openCreatePost, openCreateGroup } = useUIStore();

  const selectedGroup = activeGroupId ?? groups?.[0]?.groupId ?? null;
  const selectedGroupData = groups?.find((g) => g.groupId === selectedGroup);

  useEffect(() => {
    if (selectedGroup && !activeGroupId && groups?.length) setActiveGroupId(selectedGroup);
  }, [selectedGroup, activeGroupId, groups, setActiveGroupId]);

  return (
    <>
      <TopBar title="Feed" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Stories */}
        <StoriesBar />

        {/* Group selector */}
        <section aria-label="Group selector">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 dark:text-white text-base">Your Groups</h2>
              {groups && groups.length > 0 && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {groups.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Link href="/groups" className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-0.5 transition-colors">
                All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {groupsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[170px] sm:w-[190px] rounded-2xl overflow-hidden">
                  <div className="skeleton h-20" />
                  <div className="p-3 space-y-2 bg-white dark:bg-surface-dark-2">
                    <div className="skeleton h-4 w-24 rounded" />
                    <div className="skeleton h-3 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : groups?.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Join your first group</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">Groups are where everything happens on HiveMind. Create one or browse existing groups.</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={openCreateGroup} size="sm"><Plus className="h-4 w-4" /> Create group</Button>
                  <Link href="/groups"><Button variant="outline" size="sm">Browse</Button></Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Select a group">
              {groups?.map((group, i) => (
                <GroupCard
                  key={group.groupId}
                  group={group}
                  index={i}
                  isSelected={selectedGroup === group.groupId}
                  onSelect={() => setActiveGroupId(group.groupId)}
                />
              ))}

              {/* Create new group card */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={openCreateGroup}
                className="flex-shrink-0 w-[120px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600 transition-all flex flex-col items-center justify-center gap-2 py-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-950/30 transition-colors">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <span className="text-xs text-gray-400 font-medium">New group</span>
              </motion.button>
            </div>
          )}
        </section>

        {/* Create post CTA */}
        {selectedGroup && (
          <motion.button
            key={selectedGroup}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { setActiveGroupId(selectedGroup); openCreatePost(); }}
            className="w-full card p-4 flex items-center gap-3 hover:shadow-md transition-all text-left group border border-transparent hover:border-brand-100 dark:hover:border-brand-900"
            aria-label="Create a new post"
          >
            <Avatar name={currentUser?.name} src={currentUser?.profilePictureUrl} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                What&apos;s on your mind?
              </p>
              {selectedGroupData && (
                <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5 flex items-center gap-1">
                  Posting to
                  <span className="font-semibold text-gray-400 dark:text-gray-500">{selectedGroupData.name}</span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                    <Users className="h-2.5 w-2.5" />{formatNumber(selectedGroupData.memberCount)}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <div className="h-9 w-9 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-950/50 transition-colors">
                <Plus className="h-4 w-4 text-brand-500" />
              </div>
            </div>
          </motion.button>
        )}

        {/* Posts feed */}
        <AnimatePresence mode="wait">
          {selectedGroup ? (
            <motion.div key={selectedGroup} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <GroupFeed groupId={selectedGroup} />
            </motion.div>
          ) : (
            !groupsLoading && groups && groups.length > 0 && (
              <EmptyState icon={Rss} title="Select a group" description="Pick a group above to see its posts." />
            )
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
