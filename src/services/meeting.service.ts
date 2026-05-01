import { apiClient } from "./api-client";
import type { MeetingDto, CreateMeetingRequest } from "@/types";

export const meetingService = {
  createMeeting: async (data: CreateMeetingRequest): Promise<MeetingDto> => {
    const res = await apiClient.post<MeetingDto>("/api/v1/meetings", data);
    return res.data;
  },

  getMeeting: async (
    groupId: string,
    meetingId: string
  ): Promise<MeetingDto> => {
    const res = await apiClient.get<MeetingDto>(
      `/api/v1/meetings/${groupId}/${meetingId}`
    );
    return res.data;
  },

  getMeetingsByGroup: async (groupId: string): Promise<MeetingDto[]> => {
    const res = await apiClient.get<MeetingDto[]>(
      `/api/v1/meetings/group/${groupId}`
    );
    return res.data;
  },

  startMeeting: async (
    groupId: string,
    meetingId: string
  ): Promise<MeetingDto> => {
    const res = await apiClient.post<MeetingDto>(
      `/api/v1/meetings/${groupId}/${meetingId}/start`
    );
    return res.data;
  },

  joinMeeting: async (
    groupId: string,
    meetingId: string
  ): Promise<void> => {
    await apiClient.post(
      `/api/v1/meetings/${groupId}/${meetingId}/join`
    );
  },

  leaveMeeting: async (meetingId: string): Promise<void> => {
    await apiClient.post(`/api/v1/meetings/${meetingId}/leave`);
  },

  endMeeting: async (
    groupId: string,
    meetingId: string
  ): Promise<MeetingDto> => {
    const res = await apiClient.post<MeetingDto>(
      `/api/v1/meetings/${groupId}/${meetingId}/end`
    );
    return res.data;
  },

  getParticipants: async (meetingId: string): Promise<string[]> => {
    const res = await apiClient.get<string[]>(
      `/api/v1/meetings/${meetingId}/participants`
    );
    return res.data;
  },
};
