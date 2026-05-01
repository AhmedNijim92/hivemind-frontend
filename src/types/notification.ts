// ─── Notification Service DTOs ────────────────────────────────────────────────

export type NotificationType =
  | "USER_CREATED"
  | "POST_CREATED"
  | "MEETING_STARTED"
  | "GROUP_CREATED";

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}
