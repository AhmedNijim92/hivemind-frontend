"use client";

import { Bell, CheckCheck } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { NotificationItem } from "@/features/notifications/notification-item";
import { NotificationSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden lg:block">Notifications</h1>
            {unreadCount && unreadCount > 0 ? (
              <p className="text-sm text-gray-400 mt-0.5">{unreadCount} unread</p>
            ) : (
              <p className="text-sm text-gray-400 mt-0.5 hidden lg:block">You&apos;re all caught up</p>
            )}
          </div>
          {unreadCount && unreadCount > 0 ? (
            <button
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))
          ) : notifications?.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="You're all caught up!"
              description="New notifications will appear here."
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
