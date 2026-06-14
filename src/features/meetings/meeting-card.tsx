"use client";

import { Video, Users, Play, CheckCircle, Lock, Globe, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useStartMeeting } from "@/hooks/use-meetings";
import { useAuthStore } from "@/store/auth-store";
import { timeAgo } from "@/utils/format";
import type { MeetingDto } from "@/types";

interface MeetingCardProps {
  meeting: MeetingDto;
  index?: number;
}

export function MeetingCard({ meeting, index = 0 }: MeetingCardProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const startMeeting = useStartMeeting();

  const isHost = meeting.hostId === userId;
  const isActive = meeting.status === "ACTIVE";
  const isScheduled = meeting.status === "SCHEDULED";
  const isEnded = meeting.status === "ENDED";

  const enterRoom = () => {
    sessionStorage.setItem(`meeting-${meeting.meetingId}`, JSON.stringify({ groupId: meeting.groupId }));
    router.push(`/meetings/${meeting.meetingId}`);
  };

  const handleStart = async () => {
    await startMeeting.mutateAsync({ groupId: meeting.groupId, meetingId: meeting.meetingId });
    enterRoom();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`p-4 rounded-2xl border transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-500/[0.04] dark:to-teal-500/[0.04] border-emerald-200/60 dark:border-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/10"
          : isEnded
          ? "bg-gray-50/50 dark:bg-white/[0.01] border-gray-100 dark:border-white/[0.04] opacity-60"
          : "bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.04] hover:border-gray-200 dark:hover:border-white/[0.08] hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Icon */}
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive
            ? "bg-emerald-500 shadow-md shadow-emerald-500/30"
            : isEnded
            ? "bg-gray-200 dark:bg-gray-800"
            : "bg-brand-500/10 dark:bg-brand-500/[0.08]"
        }`}>
          {isActive ? (
            <Radio className="h-5 w-5 text-white animate-pulse" />
          ) : (
            <Video className={`h-5 w-5 ${isEnded ? "text-gray-400" : "text-brand-500"}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm truncate ${isEnded ? "text-gray-400" : "text-gray-900 dark:text-white"}`}>
              {meeting.title}
            </h3>
            {isActive && (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </span>
            )}
          </div>

          {meeting.description && !isEnded && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{meeting.description}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {meeting.participantCount} joined
            </span>
            <span className="flex items-center gap-1">
              {meeting.privacy === "PUBLIC" ? <Globe className="h-3 w-3 text-emerald-400" /> : <Lock className="h-3 w-3 text-amber-400" />}
              {meeting.privacy === "PUBLIC" ? "Anyone can join" : "Members only"}
            </span>
            {isActive && meeting.startedAt && (
              <span className="text-emerald-500 flex items-center gap-1">
                <Play className="h-3 w-3" /> Live · {timeAgo(meeting.startedAt)}
              </span>
            )}
            {isEnded && meeting.endedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> {timeAgo(meeting.endedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isEnded && (
        <div className="mt-3 flex gap-2">
          {isHost && isScheduled && (
            <Button size="sm" onClick={handleStart} loading={startMeeting.isPending} className="flex-1 rounded-xl">
              <Play className="h-3.5 w-3.5" /> Go Live
            </Button>
          )}
          {isActive && (
            <Button
              size="sm"
              onClick={enterRoom}
              className={`flex-1 rounded-xl ${isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}
            >
              <Video className="h-3.5 w-3.5" /> {isHost ? "Rejoin Room" : "Join Room"}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
