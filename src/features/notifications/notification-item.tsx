"use client";

import { useRouter } from "next/navigation";
import { Bell, Users, FileText, Video } from "lucide-react";
import { motion } from "framer-motion";
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
  USER_CREATED: "bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-950/60 dark:to-brand-950/30 text-brand-600 dark:text-brand-400",
  GROUP_CREATED: "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/60 dark:to-blue-950/30 text-blue-600 dark:text-blue-400",
  POST_CREATED: "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  MEETING_STARTED: "bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-950/60 dark:to-orange-950/30 text-orange-600 dark:text-orange-400",
};

function getNavigationPath(notification: NotificationDto): string | null {
  const ref = notification.referenceId;
  if (!ref) return null;
  switch (notification.type) {
    case "GROUP_CREATED": return `/groups/${ref}`;
    case "POST_CREATED": return `/feed`;
    case "MEETING_STARTED": return `/meetings`;
    case "USER_CREATED": return `/profile/${ref}`;
    default: return null;
  }
}

interface NotificationItemProps {
  notification: NotificationDto;
  index?: number;
}

export function NotificationItem({ notification, index = 0 }: NotificationItemProps) {
  const markAsRead = useMarkAsRead();
  const router = useRouter();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    const path = getNavigationPath(notification);
    if (path) router.push(path);
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 4, backgroundColor: "rgba(168, 85, 247, 0.03)" }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 text-left rounded-xl transition-all duration-200",
        !notification.read && "bg-brand-50/30 dark:bg-brand-950/10"
      )}
    >
      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
          colorMap[notification.type]
        )}
      >
        {iconMap[notification.type]}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm text-gray-900 dark:text-gray-100",
          !notification.read ? "font-bold" : "font-medium"
        )}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 font-medium">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot with glow */}
      {!notification.read && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-2.5 w-2.5 rounded-full bg-brand-500 flex-shrink-0 mt-2 shadow-sm shadow-brand-500/50"
        />
      )}
    </motion.button>
  );
}
