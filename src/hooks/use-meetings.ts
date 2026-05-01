import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { meetingService } from "@/services/meeting.service";
import type { CreateMeetingRequest } from "@/types";

export const meetingKeys = {
  all: ["meetings"] as const,
  byGroup: (groupId: string) => [...meetingKeys.all, "group", groupId] as const,
  detail: (groupId: string, meetingId: string) =>
    [...meetingKeys.all, groupId, meetingId] as const,
  participants: (meetingId: string) =>
    [...meetingKeys.all, meetingId, "participants"] as const,
};

export function useGroupMeetings(groupId: string) {
  return useQuery({
    queryKey: meetingKeys.byGroup(groupId),
    queryFn: () => meetingService.getMeetingsByGroup(groupId),
    enabled: !!groupId,
  });
}

export function useMeeting(groupId: string, meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.detail(groupId, meetingId),
    queryFn: () => meetingService.getMeeting(groupId, meetingId),
    enabled: !!groupId && !!meetingId,
  });
}

export function useMeetingParticipants(meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.participants(meetingId),
    queryFn: () => meetingService.getParticipants(meetingId),
    enabled: !!meetingId,
    refetchInterval: 5000, // live participant count
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMeetingRequest) =>
      meetingService.createMeeting(data),
    onSuccess: (meeting) => {
      qc.invalidateQueries({ queryKey: meetingKeys.byGroup(meeting.groupId) });
      toast.success("Meeting created!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to create meeting"),
  });
}

export function useStartMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      meetingId,
    }: {
      groupId: string;
      meetingId: string;
    }) => meetingService.startMeeting(groupId, meetingId),
    onSuccess: (meeting) => {
      qc.invalidateQueries({
        queryKey: meetingKeys.detail(meeting.groupId, meeting.meetingId),
      });
      toast.success("Meeting started!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to start meeting"),
  });
}

export function useJoinMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      meetingId,
    }: {
      groupId: string;
      meetingId: string;
    }) => meetingService.joinMeeting(groupId, meetingId),
    onSuccess: (_, { meetingId }) => {
      qc.invalidateQueries({
        queryKey: meetingKeys.participants(meetingId),
      });
      toast.success("Joined meeting!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to join meeting"),
  });
}
