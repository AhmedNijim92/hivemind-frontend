import { useQuery } from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { useGroupContextStore } from "@/store/group-context-store";
import { useFollowedGroups, useMyGroups } from "@/hooks/use-groups";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import type { PostDto } from "@/types";

export const feedKeys = {
  all: ["feed"] as const,
  byGroups: (groupIds: string[]) => [...feedKeys.all, ...groupIds.sort()] as const,
};

/**
 * Fetches the aggregated public feed:
 * - Posts from the active group
 * - Posts from groups the active group follows
 * - Enriches posts with groupName and authorName
 */
export function usePublicFeed() {
  const activeGroupId = useGroupContextStore((s) => s.activeGroupId);
  const activeGroup = useGroupContextStore((s) => s.activeGroup);
  const { data: followedGroups } = useFollowedGroups(activeGroupId ?? "");
  const { data: myGroups } = useMyGroups();
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();

  // Build list of group IDs: active group + followed groups
  const groupIds = activeGroupId
    ? [activeGroupId, ...(followedGroups?.map((f) => f.followedGroupId) ?? [])]
    : [];

  const query = useQuery({
    queryKey: feedKeys.byGroups(groupIds),
    queryFn: () => postService.getFeedByGroups(groupIds),
    enabled: groupIds.length > 0,
    staleTime: 1000 * 30,
  });

  // Enrich posts with group names and fix "Unknown" author for own posts
  const enrichedPosts: PostDto[] | undefined = query.data?.map((post) => {
    let groupName = post.groupName;
    let groupProfilePictureUrl = post.groupProfilePictureUrl ?? null;
    let authorName = post.authorName;
    let authorProfilePictureUrl = post.authorProfilePictureUrl ?? null;

    // Enrich group name and profile picture
    if (!groupName || !groupProfilePictureUrl) {
      if (post.groupId === activeGroupId && activeGroup) {
        groupName = groupName || activeGroup.name;
        groupProfilePictureUrl = groupProfilePictureUrl || activeGroup.profilePictureUrl || null;
      } else {
        const matched = myGroups?.find((g) => g.groupId === post.groupId);
        if (matched) {
          groupName = groupName || matched.name;
          groupProfilePictureUrl = groupProfilePictureUrl || matched.profilePictureUrl || null;
        }
      }
    }

    // Fix "Unknown" author for own posts and enrich profile picture
    if (post.authorId === userId && currentUser) {
      if (authorName === "Unknown" && currentUser.name) {
        authorName = currentUser.name;
      }
      if (!authorProfilePictureUrl && currentUser.profilePictureUrl) {
        authorProfilePictureUrl = currentUser.profilePictureUrl;
      }
    }

    return { ...post, groupName, groupProfilePictureUrl, authorName, authorProfilePictureUrl };
  });

  return { ...query, data: enrichedPosts };
}
