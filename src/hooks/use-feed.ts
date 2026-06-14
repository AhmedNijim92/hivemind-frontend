import { useQuery } from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { useGroupContextStore } from "@/store/group-context-store";
import { useFollowedGroups, useMyGroups } from "@/hooks/use-groups";
import type { PostDto } from "@/types";

export const feedKeys = {
  all: ["feed"] as const,
  byGroups: (groupIds: string[]) => [...feedKeys.all, ...groupIds.sort()] as const,
};

/**
 * Fetches the aggregated public feed:
 * - Posts from the active group
 * - Posts from groups the active group follows
 * - Enriches posts with groupName from user's groups
 */
export function usePublicFeed() {
  const activeGroupId = useGroupContextStore((s) => s.activeGroupId);
  const activeGroup = useGroupContextStore((s) => s.activeGroup);
  const { data: followedGroups } = useFollowedGroups(activeGroupId ?? "");
  const { data: myGroups } = useMyGroups();

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

  // Enrich posts with group names
  const enrichedPosts: PostDto[] | undefined = query.data?.map((post) => {
    if (post.groupName) return post;

    let groupName: string | undefined;
    if (post.groupId === activeGroupId && activeGroup) {
      groupName = activeGroup.name;
    } else {
      const matched = myGroups?.find((g) => g.groupId === post.groupId);
      groupName = matched?.name;
    }

    return { ...post, groupName };
  });

  return { ...query, data: enrichedPosts };
}
