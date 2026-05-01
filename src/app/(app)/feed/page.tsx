"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Rss } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { TopBar } from "@/components/layout/top-bar";
import { PostCard } from "@/features/posts/post-card";
import { PostSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useMyGroups } from "@/hooks/use-groups";
import { useGroupPosts } from "@/hooks/use-posts";
import { useUIStore } from "@/store/ui-store";
import { usePageTitle } from "@/hooks/use-page-title";

function GroupFeed({ groupId }: { groupId: string }) {
  const { data: posts, isLoading } = useGroupPosts(groupId);

  // Client-side pagination: show posts in batches of 10
  const batchSize = 10;
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Load more when sentinel is visible
  useEffect(() => {
    if (inView && posts && visibleCount < posts.length) {
      setVisibleCount((prev) => Math.min(prev + batchSize, posts.length));
    }
  }, [inView, posts, visibleCount]);

  // Reset visible count when group changes
  useEffect(() => {
    setVisibleCount(batchSize);
  }, [groupId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <EmptyState
        emoji="📝"
        title="No posts yet"
        description="Be the first to share something with the group!"
      />
    );
  }

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <div className="space-y-4">
      {visiblePosts.map((post) => (
        <PostCard key={post.postId} post={post} />
      ))}
      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  usePageTitle("Feed");
  const { data: groups, isLoading: groupsLoading } = useMyGroups();
  const { activeGroupId, setActiveGroupId, openCreatePost, openCreateGroup } =
    useUIStore();

  const selectedGroup = activeGroupId ?? groups?.[0]?.groupId ?? null;

  // Set active group for post creation
  useEffect(() => {
    if (selectedGroup && !activeGroupId && groups?.length) {
      setActiveGroupId(selectedGroup);
    }
  }, [selectedGroup, activeGroupId, groups, setActiveGroupId]);

  return (
    <>
      <TopBar title="Feed" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Group selector */}
        <section aria-label="Group selector">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white">Your Groups</h2>
            <Button size="sm" variant="ghost" onClick={openCreateGroup}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>

          {groupsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-10 w-28 rounded-xl flex-shrink-0" />
              ))}
            </div>
          ) : groups?.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No groups yet"
              description="Create or join a group to start connecting."
              actionLabel="Create your first group"
              onAction={openCreateGroup}
            />
          ) : (
            <div
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
              role="tablist"
              aria-label="Select a group"
            >
              {groups?.map((group) => (
                <button
                  key={group.groupId}
                  onClick={() => setActiveGroupId(group.groupId)}
                  role="tab"
                  aria-selected={selectedGroup === group.groupId}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedGroup === group.groupId
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Create post CTA */}
        {selectedGroup && (
          <button
            onClick={() => { setActiveGroupId(selectedGroup); openCreatePost(); }}
            className="w-full card p-4 flex items-center gap-3 hover:border-brand-200 dark:hover:border-brand-800 transition-colors text-left group"
            aria-label="Create a new post"
          >
            <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-950 transition-colors">
              <Plus className="h-4 w-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
            </div>
            <span className="text-gray-400 text-sm group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
              What&apos;s on your mind?
            </span>
          </button>
        )}

        {/* Posts feed */}
        {selectedGroup ? (
          <GroupFeed groupId={selectedGroup} />
        ) : (
          !groupsLoading && (
            <EmptyState
              icon={Rss}
              title="Your feed is empty"
              description="Join or create a group to see posts here."
              actionLabel="Browse groups"
              onAction={openCreateGroup}
            />
          )
        )}
      </div>
    </>
  );
}
