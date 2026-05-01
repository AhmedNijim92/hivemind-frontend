import { apiClient } from "./api-client";
import type { NotificationDto } from "@/types";

export const notificationService = {
  getAll: async (): Promise<NotificationDto[]> => {
    const res = await apiClient.get<NotificationDto[]>("/api/v1/notifications");
    return res.data;
  },

  getUnread: async (): Promise<NotificationDto[]> => {
    const res = await apiClient.get<NotificationDto[]>(
      "/api/v1/notifications/unread"
    );
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<number>(
      "/api/v1/notifications/unread/count"
    );
    return res.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.put(`/api/v1/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put("/api/v1/notifications/read-all");
  },
};
