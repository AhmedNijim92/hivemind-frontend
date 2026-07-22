"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Rss, ChevronRight, Globe, Lock, MessageCircle, FileText, Sparkles, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { PostCard } from "@/features/posts/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePublicFeed } from "@/hooks/use-feed";
import { useCurrentUser } from "@/hooks/use-user";
import { useGroupContextStore } from "@/store/group-context-store";
import { useUIStore } from "@/store/ui-store";
import { usePageTitle } from "@/hooks/use-page-title";
import { StoriesBar } from "@/features/stories/stories-bar";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

/* ─── Feed Content ───────────────────────────────────────────────────────── */

function FeedContent() {
  const { data: posts, isLoading, error, refetch } = usePublicFeed();
  const batchSize = 10;
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });
  const activeGroupId = useGroupContextStore((s) => s.activeGroupId);

  useEffect(() => {
    if (inView && posts && visibleCount < posts.length) {
      setVisibleCount((p) => Math.min(p + batchSize, posts.length));
    }
  }, [inView, posts, visibleCount]);

  // Reset visible count when active group changes
  useEffect(() => {
    setVisibleCount(batchSize);
  }, [activeGroupId]);

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-500 text-sm mb-3">Failed to load feed</p>
        <Button size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (!posts?.length) {
    return <EmptyState emoji="📝" title="No posts yet" description="Be the first to share something!" />;
  }

  return (
    <div className="space-y-4">
      {posts.slice(0, visibleCount).map((post) => (
        <PostCard key={post.postId} post={post} />
      ))}
      {visibleCount < posts.length && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

/* ─── Feed Page ──────────────────────────────────────────────────────────── */

export default function FeedPage() {
  usePageTitle("Feed");
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { activeGroupId, activeGroup } = useGroupContextStore();
  const { openCreatePost } = useUIStore();
  const clearActiveGroup = useGroupContextStore((s) => s.clearActiveGroup);

  const handleSwitchGroup = () => {
    clearActiveGroup();
    router.push("/select-group");
  };

  return (
    <>
      <TopBar title="Feed" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Stories */}
        <StoriesBar />

        {/* Active group context card */}
        {activeGroup && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 flex items-center gap-3 border border-brand-100/50 dark:border-brand-800/20 bg-gradient-to-r from-brand-50/50 to-transparent dark:from-brand-950/10 dark:to-transparent"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-500/20">
              <span className="text-white font-bold text-sm">
                {activeGroup.name[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {activeGroup.name}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {formatNumber(activeGroup.memberCount)} members
                <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
                {activeGroup.privacy === "PRIVATE" ? (
                  <><Lock className="h-3 w-3" /> Private</>
                ) : (
                  <><Globe className="h-3 w-3" /> Public</>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchGroup}
              className="flex-shrink-0"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Switch
            </Button>
          </motion.div>
        )}

        {/* Create post CTA */}
        {activeGroupId && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={openCreatePost}
            className="w-full card p-4 flex items-center gap-3 hover:shadow-md transition-all text-left group border border-transparent hover:border-brand-100 dark:hover:border-brand-900"
            aria-label="Create a new post"
          >
            <Avatar name={currentUser?.name} src={currentUser?.profilePictureUrl} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                What&apos;s on your mind?
              </p>
              {activeGroup && (
                <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5 flex items-center gap-1">
                  Posting to
                  <span className="font-semibold text-gray-400 dark:text-gray-500">{activeGroup.name}</span>
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
          {activeGroupId ? (
            <motion.div key={activeGroupId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <FeedContent />
            </motion.div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-950/30 dark:to-purple-950/20 flex items-center justify-center mx-auto">
                <Rss className="h-10 w-10 text-brand-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No group selected</h3>
                <p className="text-sm text-gray-400 mt-1">Select a group to see posts from your community</p>
              </div>
              <button
                onClick={() => router.push("/select-group")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
              >
                <Users className="h-4 w-4" /> Select a Group
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
