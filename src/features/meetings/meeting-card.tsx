"use client";

import { Video, Users, Clock, Play, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStartMeeting, useJoinMeeting } from "@/hooks/use-meetings";
import { useAuthStore } from "@/store/auth-store";
import { timeAgo, formatDate } from "@/utils/format";
import type { MeetingDto } from "@/types";

interface MeetingCardProps {
  meeting: MeetingDto;
  index?: number;
}

const statusVariant = {
  SCHEDULED: "default",
  ACTIVE: "active",
  ENDED: "default",
} as const;

export function MeetingCard({ meeting, index = 0 }: MeetingCardProps) {
  const userId = useAuthStore((s) => s.userId);
  const startMeeting = useStartMeeting();
  const joinMeeting = useJoinMeeting();

  const isHost = meeting.hostId === userId;
  const isActive = meeting.status === "ACTIVE";
  const isScheduled = meeting.status === "SCHEDULED";
  const isEnded = meeting.status === "ENDED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="card-hover p-5 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`h-11 w-11 rounded-xl flex items-center justify-center shadow-sm ${
              isActive
                ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/25"
                : "bg-gray-100 dark:bg-surface-dark-3 text-gray-500"
            }`}
          >
            <Video className="h-5 w-5" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {meeting.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={statusVariant[meeting.status]}>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                {meeting.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {meeting.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {meeting.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span className="font-medium">{meeting.participantCount}</span> joined
        </span>
        {meeting.scheduledAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(meeting.scheduledAt, "MMM d, h:mm a")}
          </span>
        )}
        {meeting.startedAt && isActive && (
          <span className="flex items-center gap-1 text-emerald-500">
            <Play className="h-3.5 w-3.5" />
            Live · {timeAgo(meeting.startedAt)}
          </span>
        )}
        {meeting.endedAt && (
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Ended {timeAgo(meeting.endedAt)}
          </span>
        )}
      </div>

      {/* Actions */}
      {!isEnded && (
        <div className="flex gap-2 pt-2">
          {isHost && isScheduled && (
            <Button
              size="sm"
              variant="gradient"
              onClick={() =>
                startMeeting.mutate({
                  groupId: meeting.groupId,
                  meetingId: meeting.meetingId,
                })
              }
              loading={startMeeting.isPending}
              className="flex-1"
            >
              <Play className="h-3.5 w-3.5" />
              Start meeting
            </Button>
          )}
          {isActive && !isHost && (
            <Button
              size="sm"
              onClick={() =>
                joinMeeting.mutate({
                  groupId: meeting.groupId,
                  meetingId: meeting.meetingId,
                })
              }
              loading={joinMeeting.isPending}
              className="flex-1"
            >
              <Video className="h-3.5 w-3.5" />
              Join meeting
            </Button>
          )}
          {isActive && isHost && (
            <Button size="sm" variant="secondary" className="flex-1">
              <Video className="h-3.5 w-3.5" />
              Rejoin
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
