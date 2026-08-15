"use client";

import { useState } from "react";
import { Video, Plus, Radio, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { MeetingCard } from "@/features/meetings/meeting-card";
import { CreateMeetingModal } from "@/features/meetings/create-meeting-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { useMyGroups } from "@/hooks/use-groups";
import { useGroupMeetings } from "@/hooks/use-meetings";
import { usePageTitle } from "@/hooks/use-page-title";

function GroupMeetings({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { data: meetings, isLoading } = useGroupMeetings(groupId);
  const [showCreate, setShowCreate] = useState(false);

  const activeMeetings = meetings?.filter((m) => m.status === "ACTIVE") ?? [];
  const scheduledMeetings = meetings?.filter((m) => m.status === "SCHEDULED") ?? [];
  const endedMeetings = meetings?.filter((m) => m.status === "ENDED") ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Group header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">{groupName[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{groupName}</h2>
            <p className="text-[11px] text-gray-400">{meetings?.length ?? 0} rooms</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="text-xs">
          <Plus className="h-3.5 w-3.5" /> New Room
        </Button>
      </div>

      {/* Active meetings — highlighted */}
      {activeMeetings.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Live Now</span>
          </div>
          {activeMeetings.map((m, i) => <MeetingCard key={m.meetingId} meeting={m} index={i} />)}
        </div>
      )}

      {/* Scheduled */}
      {scheduledMeetings.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Upcoming</span>
          </div>
          {scheduledMeetings.map((m, i) => <MeetingCard key={m.meetingId} meeting={m} index={i} />)}
        </div>
      )}

      {/* Ended */}
      {endedMeetings.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
            <span className="text-[11px] font-semibold text-gray-300 dark:text-gray-600 uppercase tracking-wider">Past</span>
          </div>
          {endedMeetings.map((m, i) => <MeetingCard key={m.meetingId} meeting={m} index={i} />)}
        </div>
      )}

      {!meetings?.length && (
        <div className="card p-8 text-center border border-dashed border-gray-200 dark:border-gray-800">
          <Video className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No rooms yet</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Create one to go live</p>
        </div>
      )}

      <CreateMeetingModal open={showCreate} onClose={() => setShowCreate(false)} groupId={groupId} />
    </section>
  );
}

export default function MeetingsPage() {
  usePageTitle("Meetings");
  const { data: groups, isLoading: groupsLoading } = useMyGroups();

  return (
    <PageTransition>
      <TopBar title="Meetings" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Rooms</h1>
          <p className="text-gray-400 text-sm mt-0.5">Start or join live rooms with your groups</p>
        </motion.div>

        {groupsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : groups?.length === 0 ? (
          <EmptyState icon={Video} title="No groups yet" description="Join a group to create live rooms." />
        ) : (
          <div className="space-y-8">
            {groups?.map((group) => (
              <GroupMeetings key={group.groupId} groupId={group.groupId} groupName={group.name} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
