import { useQuery } from "@tanstack/react-query";
import { groupService } from "@/services/group.service";
import { userService } from "@/services/user.service";
import type { GroupDto, UserProfileDto } from "@/types";

export const searchKeys = {
  groups: (q: string) => ["search", "groups", q] as const,
  users: (q: string) => ["search", "users", q] as const,
};

/**
 * Search groups by filtering the user's groups client-side.
 * (Backend doesn't have a search endpoint, so we filter locally.)
 */
export function useSearchGroups(query: string) {
  return useQuery({
    queryKey: searchKeys.groups(query),
    queryFn: async (): Promise<GroupDto[]> => {
      const groups = await groupService.getMyGroups();
      if (!query.trim()) return groups;
      const q = query.toLowerCase();
      return groups.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q)
      );
    },
    enabled: query.length > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Search users by userId (the backend exposes profile by ID).
 * For now, we search followers/following lists client-side.
 */
export function useSearchUsers(query: string, userId: string) {
  return useQuery({
    queryKey: searchKeys.users(query),
    queryFn: async (): Promise<UserProfileDto[]> => {
      if (!query.trim() || !userId) return [];
      const [followers, following] = await Promise.all([
        userService.getFollowers(userId),
        userService.getFollowing(userId),
      ]);
      // Merge and deduplicate
      const map = new Map<string, UserProfileDto>();
      [...followers, ...following].forEach((u) => map.set(u.userId, u));
      const all = Array.from(map.values());
      const q = query.toLowerCase();
      return all.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.mobileNumber.includes(query)
      );
    },
    enabled: query.length >= 2 && !!userId,
    staleTime: 1000 * 30,
  });
}
