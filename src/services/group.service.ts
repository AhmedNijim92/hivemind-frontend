import { apiClient } from "./api-client";
import type { GroupDto, CreateGroupRequest, GroupMember } from "@/types";

export const groupService = {
  createGroup: async (data: CreateGroupRequest): Promise<GroupDto> => {
    const res = await apiClient.post<GroupDto>("/api/v1/groups", data);
    return res.data;
  },

  getGroup: async (groupId: string): Promise<GroupDto> => {
    const res = await apiClient.get<GroupDto>(`/api/v1/groups/${groupId}`);
    return res.data;
  },

  getMyGroups: async (): Promise<GroupDto[]> => {
    const res = await apiClient.get<GroupDto[]>("/api/v1/groups/my");
    return res.data;
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
};
