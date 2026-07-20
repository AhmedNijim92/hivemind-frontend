/**
 * Story store — persisted to localStorage.
 * Stories are group-based: posted by members on behalf of their group.
 * Each story expires 24 hours after creation.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Story, StoryGroup } from "@/types/story";

interface StoryStore {
  stories: Story[];

  addStory: (story: Story) => void;
  viewStory: (storyId: string, viewerId: string) => void;
  removeExpired: () => void;
  getGroupedStories: (currentUserId: string) => StoryGroup[];
}

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      stories: [],

      addStory: (story) =>
        set((state) => ({ stories: [story, ...state.stories] })),

      viewStory: (storyId, viewerId) =>
        set((state) => ({
          stories: state.stories.map((s) =>
            s.id === storyId && !s.viewedBy.includes(viewerId)
              ? { ...s, viewedBy: [...s.viewedBy, viewerId] }
              : s
          ),
        })),

      removeExpired: () =>
        set((state) => ({
          stories: state.stories.filter(
            (s) => new Date(s.expiresAt).getTime() > Date.now()
          ),
        })),

      getGroupedStories: (currentUserId) => {
        const { stories } = get();
        const now = Date.now();

        // Filter expired
        const active = stories.filter(
          (s) => new Date(s.expiresAt).getTime() > now
        );

        // Group by groupId (stories belong to groups, not individual users)
        const map = new Map<string, Story[]>();
        for (const story of active) {
          const key = story.groupId;
          const existing = map.get(key) ?? [];
          existing.push(story);
          map.set(key, existing);
        }

        // Build StoryGroup array
        const groups: StoryGroup[] = [];
        for (const [groupId, groupStories] of map) {
          const sorted = [...groupStories].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const first = sorted[0];
          groups.push({
            groupId,
            groupName: first.groupName,
            groupAvatar: null,
            stories: sorted,
            hasUnviewed: sorted.some((s) => !s.viewedBy.includes(currentUserId)),
          });
        }

        // Sort: unviewed first, then by recency
        groups.sort((a, b) => {
          if (a.hasUnviewed && !b.hasUnviewed) return -1;
          if (!a.hasUnviewed && b.hasUnviewed) return 1;
          const aLatest = new Date(a.stories[a.stories.length - 1].createdAt).getTime();
          const bLatest = new Date(b.stories[b.stories.length - 1].createdAt).getTime();
          return bLatest - aLatest;
        });

        return groups;
      },
    }),
    {
      name: "hivemind-stories",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : sessionStorage
      ),
    }
  )
);
