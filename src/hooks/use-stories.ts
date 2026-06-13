import { useEffect, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useStoryStore } from "@/store/story-store";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { mediaService } from "@/services/media.service";
import type { Story, StoryGroup } from "@/types/story";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * Returns grouped stories for the feed bar.
 * Auto-removes expired stories on mount.
 */
export function useStories(): {
  groups: StoryGroup[];
  isLoading: boolean;
} {
  const userId = useAuthStore((s) => s.userId);
  const removeExpired = useStoryStore((s) => s.removeExpired);
  const getGroupedStories = useStoryStore((s) => s.getGroupedStories);

  // Clean up expired stories on mount
  useEffect(() => {
    removeExpired();
  }, [removeExpired]);

  const groups = userId ? getGroupedStories(userId) : [];

  return { groups, isLoading: false };
}

/**
 * Hook to create a new story.
 * Uploads the image via media service, then adds to the local store.
 */
export function useCreateStory() {
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const addStory = useStoryStore((s) => s.addStory);
  const [isPending, setIsPending] = useState(false);

  const createStory = useCallback(
    async (file: File, caption: string | null) => {
      if (!userId || !currentUser) {
        toast.error("You must be logged in to create a story");
        return;
      }

      setIsPending(true);
      try {
        // Upload image via media service
        const uploaded = await mediaService.upload(file, undefined, "POST");
        const mediaUrl = `/api/v1/media/${uploaded.mediaId}/download`;

        const now = new Date();
        const story: Story = {
          id: crypto.randomUUID(),
          userId,
          userName: currentUser.name,
          userAvatar: currentUser.profilePictureUrl ?? null,
          mediaUrl,
          caption: caption?.trim() || null,
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + TWENTY_FOUR_HOURS).toISOString(),
          viewedBy: [userId], // Creator has already "seen" their own story
        };

        addStory(story);
        toast.success("Story posted!");
      } catch {
        toast.error("Failed to upload story");
      } finally {
        setIsPending(false);
      }
    },
    [userId, currentUser, addStory]
  );

  return { createStory, isPending };
}

/**
 * Hook to mark a story as viewed by the current user.
 */
export function useViewStory() {
  const userId = useAuthStore((s) => s.userId);
  const viewStory = useStoryStore((s) => s.viewStory);

  const markViewed = useCallback(
    (storyId: string) => {
      if (userId) {
        viewStory(storyId, userId);
      }
    },
    [userId, viewStory]
  );

  return { markViewed };
}
