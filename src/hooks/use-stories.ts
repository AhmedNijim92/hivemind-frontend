import { useEffect, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useStoryStore } from "@/store/story-store";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useGroupContextStore } from "@/store/group-context-store";
import { mediaService } from "@/services/media.service";
import type { Story, StoryGroup } from "@/types/story";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * Returns grouped stories for the feed bar.
 * Stories are grouped by group (not by user).
 */
export function useStories(): {
  groups: StoryGroup[];
  isLoading: boolean;
} {
  const userId = useAuthStore((s) => s.userId);
  const removeExpired = useStoryStore((s) => s.removeExpired);
  const getGroupedStories = useStoryStore((s) => s.getGroupedStories);

  useEffect(() => {
    removeExpired();
  }, [removeExpired]);

  const groups = userId ? getGroupedStories(userId) : [];

  return { groups, isLoading: false };
}

/**
 * Create a story for the active group.
 * Stories are posted on behalf of the group by a member.
 */
export function useCreateStory() {
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const activeGroup = useGroupContextStore((s) => s.activeGroup);
  const addStory = useStoryStore((s) => s.addStory);
  const [isPending, setIsPending] = useState(false);

  const createStory = useCallback(
    async (file: File, caption: string | null) => {
      if (!userId || !currentUser) {
        toast.error("You must be logged in");
        return;
      }
      if (!activeGroup) {
        toast.error("Select a group first");
        return;
      }

      setIsPending(true);
      try {
        const uploaded = await mediaService.upload(file, undefined, "POST");
        const mediaUrl = `/api/v1/media/${uploaded.mediaId}/download`;

        const now = new Date();
        const story: Story = {
          id: crypto.randomUUID(),
          groupId: activeGroup.groupId,
          groupName: activeGroup.name,
          userId,
          userName: currentUser.name,
          userAvatar: currentUser.profilePictureUrl ?? null,
          mediaUrl,
          caption: caption?.trim() || null,
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + TWENTY_FOUR_HOURS).toISOString(),
          viewedBy: [userId],
        };

        addStory(story);
        toast.success("Story posted to " + activeGroup.name + "!");
      } catch {
        toast.error("Failed to upload story");
      } finally {
        setIsPending(false);
      }
    },
    [userId, currentUser, activeGroup, addStory]
  );

  return { createStory, isPending };
}

/**
 * View a story (mark as viewed by current user).
 */
export function useViewStory() {
  const userId = useAuthStore((s) => s.userId);
  const viewStory = useStoryStore((s) => s.viewStory);

  return useCallback(
    (storyId: string) => {
      if (userId) viewStory(storyId, userId);
    },
    [userId, viewStory]
  );
}
