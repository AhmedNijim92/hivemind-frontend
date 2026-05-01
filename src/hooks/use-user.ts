import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/auth-store";
import type { UpdateProfileRequest } from "@/types";

export const userKeys = {
  all: ["users"] as const,
  profile: (id: string) => [...userKeys.all, id] as const,
  followers: (id: string) => [...userKeys.all, id, "followers"] as const,
  following: (id: string) => [...userKeys.all, id, "following"] as const,
};

export function useProfile(userId: string) {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: () => userService.getProfile(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCurrentUser() {
  const userId = useAuthStore((s) => s.userId);
  return useProfile(userId ?? "");
}

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: userKeys.followers(userId),
    queryFn: () => userService.getFollowers(userId),
    enabled: !!userId,
  });
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: userKeys.following(userId),
    queryFn: () => userService.getFollowing(userId),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      userService.updateProfile(userId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.profile(userId!) });
      toast.success("Profile updated!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to update profile"),
  });
}

export function useFollowUser() {
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: (targetUserId: string) =>
      userService.followUser(currentUserId!, targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.following(currentUserId!) });
      toast.success("Following!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to follow"),
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: (targetUserId: string) =>
      userService.unfollowUser(currentUserId!, targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.following(currentUserId!) });
      toast.success("Unfollowed");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to unfollow"),
  });
}
