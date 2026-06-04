/**
 * Story store — persisted to localStorage.
 * Stories are client-side only (no backend API).
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

        // Filter out expired stories
        const active = stories.filter(
          (s) => new Date(s.expiresAt).getTime() > now
        );

        // Group by userId
        const map = new Map<string, Story[]>();
        for (const story of active) {
          const existing = map.get(story.userId) ?? [];
          existing.push(story);
          map.set(story.userId, existing);
        }

        // Build StoryGroup array
        const groups: StoryGroup[] = [];
        for (const [userId, userStories] of map) {
          // Sort stories oldest-first within each group
          const sorted = [...userStories].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const first = sorted[0];
          groups.push({
            userId,
            userName: first.userName,
            userAvatar: first.userAvatar,
            stories: sorted,
            hasUnviewed: sorted.some(
              (s) => !s.viewedBy.includes(currentUserId)
            ),
          });
        }

        // Sort: current user first, then unviewed groups, then viewed
        groups.sort((a, b) => {
          if (a.userId === currentUserId) return -1;
          if (b.userId === currentUserId) return 1;
          if (a.hasUnviewed && !b.hasUnviewed) return -1;
          if (!a.hasUnviewed && b.hasUnviewed) return 1;
          // Most recent story first among same-status groups
          const aLatest = new Date(
            a.stories[a.stories.length - 1].createdAt
          ).getTime();
          const bLatest = new Date(
            b.stories[b.stories.length - 1].createdAt
          ).getTime();
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
