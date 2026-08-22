"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Mic, Radio } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useMyGroups } from "@/hooks/use-groups";
import { useQuery } from "@tanstack/react-query";
import { meetingService } from "@/services/meeting.service";
import { useHaptic } from "@/hooks/use-haptic";
import type { MeetingDto } from "@/types";

/**
 * Live Rooms Feed Block — shows active public meetings from your groups.
 * Appears on the feed page. Hover effect simulates "listening in".
 */
export function LiveRoomsFeed() {
  const { data: myGroups } = useMyGroups();
  const router = useRouter();
  const haptic = useHaptic();

  // Fetch active meetings from all user's groups
  const { data: liveMeetings } = useQuery({
    queryKey: ["live-meetings-feed", myGroups?.map((g) => g.groupId)],
    queryFn: async () => {
      if (!myGroups?.length) return [];
      const results: (MeetingDto & { groupName: string; groupProfilePictureUrl?: string | null })[] = [];
      await Promise.all(
        myGroups.map(async (group) => {
          try {
            const meetings = await meetingService.getMeetingsByGroup(group.groupId);
            meetings
              .filter((m) => m.status === "ACTIVE")
              .forEach((m) => results.push({ ...m, groupName: group.name, groupProfilePictureUrl: group.profilePictureUrl }));
          } catch {}
        })
      );
      return results;
    },
    enabled: !!myGroups && myGroups.length > 0,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  if (!liveMeetings?.length) return null;

  return (
    <div className="card p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <Radio className="h-4 w-4 text-red-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Live Now</h3>
        <span className="text-xs text-gray-400 ml-auto">{liveMeetings.length} room{liveMeetings.length > 1 ? "s" : ""}</span>
      </div>

      {/* Horizontally scrollable live rooms */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {liveMeetings.map((meeting) => (
          <LiveRoomCard
            key={meeting.meetingId}
            meeting={meeting}
            onJoin={() => {
              haptic.tap();
              sessionStorage.setItem(`meeting-${meeting.meetingId}`, JSON.stringify({ groupId: meeting.groupId }));
              router.push(`/meetings/${meeting.meetingId}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function LiveRoomCard({ meeting, onJoin }: {
  meeting: MeetingDto & { groupName: string; groupProfilePictureUrl?: string | null };
  onJoin: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onJoin}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative flex-shrink-0 w-56 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/[0.06] bg-gradient-to-br from-purple-50 to-brand-50 dark:from-purple-950/30 dark:to-brand-950/20 transition-all hover:shadow-lg hover:shadow-brand-500/10 text-left group"
    >
      {/* Animated gradient when hovered (simulates "listening") */}
      <motion.div
        animate={hovered ? { opacity: 1 } : { opacity: 0 }}
        className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-purple-500/10 to-pink-500/10"
      />

      {/* Sound wave animation when hovered */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-3 right-3 flex items-center gap-[2px]"
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ height: [4, 12 + Math.random() * 8, 4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
              className="w-[2px] rounded-full bg-brand-500"
            />
          ))}
        </motion.div>
      )}

      <div className="relative p-4 space-y-3">
        {/* LIVE badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm shadow-red-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Users className="h-3 w-3" /> {meeting.participantCount ?? 1}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{meeting.title}</h4>

        {/* Group info */}
        <div className="flex items-center gap-2">
          <Avatar
            name={meeting.groupName}
            src={meeting.groupProfilePictureUrl}
            size="xs"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{meeting.groupName}</span>
        </div>

        {/* Hover CTA */}
        <motion.div
          animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400"
        >
          <Mic className="h-3 w-3" />
          Tap to join
        </motion.div>
      </div>
    </motion.button>
  );
}
