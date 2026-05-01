"use client";

import { Bell, CheckCheck } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { NotificationItem } from "@/features/notifications/notification-item";
import { NotificationSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkAllAsRead,
  useUnreadCount,
} from "@/hooks/use-notifications";
import { usePageTitle } from "@/hooks/use-page-title";

export default function NotificationsPage() {
  usePageTitle("Notifications");
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();

  return (
    <>
      <TopBar title="Notifications" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount && unreadCount > 0 ? (
              <p className="text-sm text-gray-500 mt-0.5">
                {unreadCount} unread
              </p>
            ) : null}
          </div>
          {unreadCount && unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              loading={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))
          ) : notifications?.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="You're all caught up!"
              description="New notifications will appear here when someone interacts with your content."
            />
          ) : (
            notifications?.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
