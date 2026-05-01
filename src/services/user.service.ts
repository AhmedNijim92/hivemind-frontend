import { apiClient } from "./api-client";
import type { UserProfileDto, UpdateProfileRequest } from "@/types";

export const userService = {
  getProfile: async (userId: string): Promise<UserProfileDto> => {
    const res = await apiClient.get<UserProfileDto>(`/api/v1/users/${userId}`);
    return res.data;
  },

  updateProfile: async (
    userId: string,
    data: UpdateProfileRequest
  ): Promise<UserProfileDto> => {
    const res = await apiClient.put<UserProfileDto>(
      `/api/v1/users/${userId}`,
      data
    );
    return res.data;
  },

  followUser: async (userId: string, targetUserId: string): Promise<void> => {
    await apiClient.post(`/api/v1/users/${userId}/follow/${targetUserId}`);
  },

  unfollowUser: async (
    userId: string,
    targetUserId: string
  ): Promise<void> => {
    await apiClient.delete(`/api/v1/users/${userId}/follow/${targetUserId}`);
  },

  getFollowers: async (userId: string): Promise<UserProfileDto[]> => {
    const res = await apiClient.get<UserProfileDto[]>(
      `/api/v1/users/${userId}/followers`
    );
    return res.data;
  },

  getFollowing: async (userId: string): Promise<UserProfileDto[]> => {
    const res = await apiClient.get<UserProfileDto[]>(
      `/api/v1/users/${userId}/following`
    );
    return res.data;
  },
};
