import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { groupService } from "@/services/group.service";
import type { CreateGroupRequest, GroupFollowRequest } from "@/types";

export const groupKeys = {
  all: ["groups"] as const,
  mine: () => [...groupKeys.all, "mine"] as const,
  memberships: () => [...groupKeys.all, "memberships"] as const,
  detail: (id: string) => [...groupKeys.all, id] as const,
  members: (id: string) => [...groupKeys.all, id, "members"] as const,
  following: (id: string) => [...groupKeys.all, id, "following"] as const,
  likeCount: (id: string) => [...groupKeys.all, id, "likeCount"] as const,
  isLiked: (id: string) => [...groupKeys.all, id, "isLiked"] as const,
};

export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.mine(),
    queryFn: () => groupService.getMyGroups(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

/** Get all groups where user has approved membership — used for group selection entry screen */
export function useUserMemberships() {
  return useQuery({
    queryKey: groupKeys.memberships(),
    queryFn: () => groupService.getUserMemberships(),
    staleTime: 1000 * 30, // 30s
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => groupService.getGroup(groupId),
    enabled: !!groupId,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => groupService.getMembers(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupRequest) => groupService.createGroup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.mine() });
      qc.invalidateQueries({ queryKey: groupKeys.memberships() });
      toast.success("Group created!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to create group"),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupService.joinGroup(groupId),
    onSuccess: (_, groupId) => {
      qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.mine() });
      qc.invalidateQueries({ queryKey: groupKeys.memberships() });
      toast.success("Joined group!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to join group"),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupService.leaveGroup(groupId),
    onSuccess: (_, groupId) => {
      qc.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.mine() });
      qc.invalidateQueries({ queryKey: groupKeys.memberships() });
      toast.success("Left group");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to leave group"),
  });
}

// ─── Group Follow Hooks (Admin Only) ──────────────────────────────────────────

export function useFollowedGroups(groupId: string) {
  return useQuery({
    queryKey: groupKeys.following(groupId),
    queryFn: () => groupService.getFollowedGroups(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 30,
  });
}

export function useFollowGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: GroupFollowRequest }) =>
      groupService.followGroup(groupId, data),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupKeys.following(groupId) });
      toast.success("Now following group!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to follow group"),
  });
}

export function useUnfollowGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, targetGroupId }: { groupId: string; targetGroupId: string }) =>
      groupService.unfollowGroup(groupId, targetGroupId),
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: groupKeys.following(groupId) });
      toast.success("Unfollowed group");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to unfollow group"),
  });
}

// ─── Group Like Hooks ─────────────────────────────────────────────────────────

export function useGroupLikeCount(groupId: string) {
  return useQuery({
    queryKey: groupKeys.likeCount(groupId),
    queryFn: () => groupService.getLikeCount(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 30,
  });
}

export function useIsGroupLiked(groupId: string) {
  return useQuery({
    queryKey: groupKeys.isLiked(groupId),
    queryFn: () => groupService.isLikedByUser(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 30,
  });
}

export function useLikeGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupService.likeGroup(groupId),
    onSuccess: (_, groupId) => {
      qc.invalidateQueries({ queryKey: groupKeys.likeCount(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.isLiked(groupId) });
      toast.success("Group liked!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to like group"),
  });
}

export function useUnlikeGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupService.unlikeGroup(groupId),
    onSuccess: (_, groupId) => {
      qc.invalidateQueries({ queryKey: groupKeys.likeCount(groupId) });
      qc.invalidateQueries({ queryKey: groupKeys.isLiked(groupId) });
      toast.success("Group unliked");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to unlike group"),
  });
}
