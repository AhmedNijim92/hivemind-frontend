"use client";

import { useMemo } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { PageTransition } from "@/components/ui/page-transition";
import { NotificationItem } from "@/features/notifications/notification-item";
import { NotificationSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useHaptic } from "@/hooks/use-haptic";
import {
  useNotifications,
  useMarkAllAsRead,
  useUnreadCount,
} from "@/hooks/use-notifications";
import { usePageTitle } from "@/hooks/use-page-title";
import type { NotificationDto } from "@/types";

function groupByTime(notifications: NotificationDto[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: NotificationDto[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    if (date >= today) groups[0].items.push(n);
    else if (date >= yesterday) groups[1].items.push(n);
    else if (date >= weekAgo) groups[2].items.push(n);
    else groups[3].items.push(n);
  });

  return groups.filter((g) => g.items.length > 0);
}

export default function NotificationsPage() {
  usePageTitle("Notifications");
  const haptic = useHaptic();
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();

  const grouped = useMemo(
    () => (notifications ? groupByTime(notifications) : []),
    [notifications]
  );

  return (
    <PageTransition>
      <TopBar title="Notifications" />
      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden lg:block">
              Notifications
            </h1>
            {unreadCount && unreadCount > 0 ? (
              <p className="text-sm text-gray-400 mt-0.5">
                {unreadCount} unread
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-0.5 hidden lg:block">
                You&apos;re all caught up
              </p>
            )}
          </div>
          {unreadCount && unreadCount > 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                haptic.success();
                markAllAsRead.mutate();
              }}
              disabled={markAllAsRead.isPending}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/20"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </motion.button>
          ) : null}
        </div>

        {/* Grouped notifications */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up!"
            description="New notifications will appear here."
          />
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.items.map((n, i) => (
                    <NotificationItem key={n.id} notification={n} index={i} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
