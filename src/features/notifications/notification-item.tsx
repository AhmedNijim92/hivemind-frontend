"use client";

import { Bell, Users, FileText, Video } from "lucide-react";
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/format";
import { useMarkAsRead } from "@/hooks/use-notifications";
import type { NotificationDto, NotificationType } from "@/types";

const iconMap: Record<NotificationType, React.ReactNode> = {
  USER_CREATED: <Bell className="h-4 w-4" />,
  GROUP_CREATED: <Users className="h-4 w-4" />,
  POST_CREATED: <FileText className="h-4 w-4" />,
  MEETING_STARTED: <Video className="h-4 w-4" />,
};

const colorMap: Record<NotificationType, string> = {
  USER_CREATED: "bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400",
  GROUP_CREATED: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  POST_CREATED: "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400",
  MEETING_STARTED: "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
};

interface NotificationItemProps {
  notification: NotificationDto;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const markAsRead = useMarkAsRead();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-surface-dark-3 transition-colors rounded-xl",
        !notification.read && "bg-brand-50/50 dark:bg-brand-950/20"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
          colorMap[notification.type]
        )}
      >
        {iconMap[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
      )}
    </button>
  );
}
