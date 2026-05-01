import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

export const notifKeys = {
  all: ["notifications"] as const,
  unread: () => [...notifKeys.all, "unread"] as const,
  count: () => [...notifKeys.all, "count"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notifKeys.all,
    queryFn: () => notificationService.getAll(),
    staleTime: 1000 * 30,
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: notifKeys.unread(),
    queryFn: () => notificationService.getUnread(),
    staleTime: 1000 * 30,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notifKeys.count(),
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 1000 * 30, // poll every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 1000 * 15,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all });
      qc.invalidateQueries({ queryKey: notifKeys.count() });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.all });
      qc.invalidateQueries({ queryKey: notifKeys.count() });
    },
  });
}
