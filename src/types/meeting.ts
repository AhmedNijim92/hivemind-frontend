// ─── Meeting Service DTOs ─────────────────────────────────────────────────────

export type MeetingStatus = "SCHEDULED" | "ACTIVE" | "ENDED";
export type MeetingPrivacy = "PUBLIC" | "PRIVATE";

export interface MeetingDto {
  meetingId: string;
  groupId: string;
  hostId: string;
  title: string;
  description: string | null;
  status: MeetingStatus;
  privacy: MeetingPrivacy;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  participantCount: number;
}

export interface CreateMeetingRequest {
  groupId: string;
  title: string;
  description?: string;
  privacy?: MeetingPrivacy;
  scheduledAt?: string; // ISO datetime string
}
