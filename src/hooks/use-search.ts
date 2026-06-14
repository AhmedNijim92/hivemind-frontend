import { useQuery } from "@tanstack/react-query";
import { groupService } from "@/services/group.service";
import { userService } from "@/services/user.service";
import type { GroupDto, UserProfileDto } from "@/types";

export const searchKeys = {
  groups: (q: string) => ["search", "groups", q] as const,
  users: (q: string) => ["search", "users", q] as const,
};

/**
 * Search all public groups via backend search endpoint.
 */
export function useSearchGroups(query: string) {
  return useQuery({
    queryKey: searchKeys.groups(query),
    queryFn: async (): Promise<GroupDto[]> => {
      return groupService.searchGroups(query);
    },
    enabled: query.trim().length >= 1,
    staleTime: 1000 * 15,
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
