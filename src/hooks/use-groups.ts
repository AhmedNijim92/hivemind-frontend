import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { groupService } from "@/services/group.service";
import type { CreateGroupRequest } from "@/types";

export const groupKeys = {
  all: ["groups"] as const,
  mine: () => [...groupKeys.all, "mine"] as const,
  detail: (id: string) => [...groupKeys.all, id] as const,
  members: (id: string) => [...groupKeys.all, id, "members"] as const,
};

export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.mine(),
    queryFn: () => groupService.getMyGroups(),
    staleTime: 1000 * 60 * 5, // 5 min
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
      toast.success("Left group");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to leave group"),
  });
}
