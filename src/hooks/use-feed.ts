import { useQuery } from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { useGroupContextStore } from "@/store/group-context-store";
import { useFollowedGroups } from "@/hooks/use-groups";

export const feedKeys = {
  all: ["feed"] as const,
  byGroups: (groupIds: string[]) => [...feedKeys.all, ...groupIds.sort()] as const,
};

/**
 * Fetches the aggregated public feed:
 * - Posts from the active group
 * - Posts from groups the active group follows
 */
export function usePublicFeed() {
  const activeGroupId = useGroupContextStore((s) => s.activeGroupId);
  const { data: followedGroups } = useFollowedGroups(activeGroupId ?? "");

  // Build list of group IDs: active group + followed groups
  const groupIds = activeGroupId
    ? [activeGroupId, ...(followedGroups?.map((f) => f.followedGroupId) ?? [])]
    : [];

  return useQuery({
    queryKey: feedKeys.byGroups(groupIds),
    queryFn: () => postService.getFeedByGroups(groupIds),
    enabled: groupIds.length > 0,
    staleTime: 1000 * 30,
  });
}
