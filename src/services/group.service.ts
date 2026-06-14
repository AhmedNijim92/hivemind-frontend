import { apiClient } from "./api-client";
import type { GroupDto, CreateGroupRequest, GroupMember, UserGroupDto, GroupFollowDto, GroupFollowRequest } from "@/types";

export const groupService = {
  createGroup: async (data: CreateGroupRequest): Promise<GroupDto> => {
    const res = await apiClient.post<GroupDto>("/api/v1/groups", data);
    return res.data;
  },

  getGroup: async (groupId: string): Promise<GroupDto> => {
    const res = await apiClient.get<GroupDto>(`/api/v1/groups/${groupId}`);
    return res.data;
  },

  updateGroup: async (groupId: string, data: { name?: string; description?: string; profilePictureUrl?: string; coverPictureUrl?: string }): Promise<GroupDto> => {
    const res = await apiClient.put<GroupDto>(`/api/v1/groups/${groupId}`, data);
    return res.data;
  },

  getMyGroups: async (): Promise<GroupDto[]> => {
    const res = await apiClient.get<GroupDto[]>("/api/v1/groups/my");
    return res.data;
  },

  searchGroups: async (query: string): Promise<GroupDto[]> => {
    const res = await apiClient.get<GroupDto[]>(`/api/v1/groups/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  /** Get all groups where user has an approved membership */
  getUserMemberships: async (): Promise<UserGroupDto[]> => {
    const res = await apiClient.get<UserGroupDto[]>("/api/v1/groups/memberships");
    return res.data;
  },

  /** Check if user has approved membership in a specific group */
  checkMembership: async (groupId: string): Promise<boolean> => {
    try {
      await apiClient.get(`/api/v1/groups/${groupId}/membership/check`);
      return true;
    } catch {
      return false;
    }
  },

  joinGroup: async (groupId: string): Promise<void> => {
    await apiClient.post(`/api/v1/groups/${groupId}/join`);
  },

  leaveGroup: async (groupId: string): Promise<void> => {
    await apiClient.post(`/api/v1/groups/${groupId}/leave`);
  },

  getMembers: async (groupId: string): Promise<GroupMember[]> => {
    const res = await apiClient.get<GroupMember[]>(
      `/api/v1/groups/${groupId}/members`
    );
    return res.data;
  },

  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/groups/${groupId}/members/${userId}`);
  },

  // ─── Group Follow (Admin Only) ─────────────────────────────────────────────

  followGroup: async (groupId: string, data: GroupFollowRequest): Promise<GroupFollowDto> => {
    const res = await apiClient.post<GroupFollowDto>(`/api/v1/groups/${groupId}/follow`, data);
    return res.data;
  },

  unfollowGroup: async (groupId: string, targetGroupId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/groups/${groupId}/follow/${targetGroupId}`);
  },

  getFollowedGroups: async (groupId: string): Promise<GroupFollowDto[]> => {
    const res = await apiClient.get<GroupFollowDto[]>(`/api/v1/groups/${groupId}/following`);
    return res.data;
  },

  // ─── Group Like ─────────────────────────────────────────────────────────────

  likeGroup: async (groupId: string): Promise<void> => {
    await apiClient.post(`/api/v1/groups/${groupId}/like`);
  },

  unlikeGroup: async (groupId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/groups/${groupId}/like`);
  },

  getLikeCount: async (groupId: string): Promise<number> => {
    const res = await apiClient.get<number>(`/api/v1/groups/${groupId}/likes/count`);
    return res.data;
  },

  isLikedByUser: async (groupId: string): Promise<boolean> => {
    const res = await apiClient.get<boolean>(`/api/v1/groups/${groupId}/likes/check`);
    return res.data;
  },
};
