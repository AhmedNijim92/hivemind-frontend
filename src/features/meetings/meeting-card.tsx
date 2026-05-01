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
}

const statusVariant = {
  SCHEDULED: "default",
  ACTIVE: "active",
  ENDED: "default",
} as const;

export function MeetingCard({ meeting }: MeetingCardProps) {
  const userId = useAuthStore((s) => s.userId);
  const startMeeting = useStartMeeting();
  const joinMeeting = useJoinMeeting();

  const isHost = meeting.hostId === userId;
  const isActive = meeting.status === "ACTIVE";
  const isScheduled = meeting.status === "SCHEDULED";
  const isEnded = meeting.status === "ENDED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              isActive
                ? "bg-green-100 dark:bg-green-950 text-green-600"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            }`}
          >
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {meeting.title}
            </h3>
            <Badge variant={statusVariant[meeting.status]} className="mt-0.5">
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
              {meeting.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Description */}
      {meeting.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {meeting.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {meeting.participantCount} participants
        </span>
        {meeting.scheduledAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(meeting.scheduledAt, "MMM d, h:mm a")}
          </span>
        )}
        {meeting.startedAt && (
          <span className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            Started {timeAgo(meeting.startedAt)}
          </span>
        )}
        {meeting.endedAt && (
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Ended {timeAgo(meeting.endedAt)}
          </span>
        )}
      </div>

      {/* Actions */}
      {!isEnded && (
        <div className="flex gap-2 pt-1">
          {isHost && isScheduled && (
            <Button
              size="sm"
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
