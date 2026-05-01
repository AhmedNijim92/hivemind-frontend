"use client";

import { useState } from "react";
import { Video, Plus } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { MeetingCard } from "@/features/meetings/meeting-card";
import { CreateMeetingModal } from "@/features/meetings/create-meeting-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useMyGroups } from "@/hooks/use-groups";
import { useGroupMeetings } from "@/hooks/use-meetings";
import { usePageTitle } from "@/hooks/use-page-title";

function GroupMeetings({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { data: meetings, isLoading } = useGroupMeetings(groupId);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
          {groupName}
        </h2>
        <Button size="sm" variant="ghost" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
      </div>

      {!meetings?.length ? (
        <div className="card p-6 text-center">
          <p className="text-gray-400 text-sm">No meetings scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <MeetingCard key={m.meetingId} meeting={m} />
          ))}
        </div>
      )}

      <CreateMeetingModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        groupId={groupId}
      />
    </section>
  );
}

export default function MeetingsPage() {
  usePageTitle("Meetings");
  const { data: groups, isLoading: groupsLoading } = useMyGroups();

  return (
    <>
      <TopBar title="Meetings" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Meetings
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Schedule and join meetings with your groups
          </p>
        </div>

        {groupsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : groups?.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No groups yet"
            description="Join a group to schedule and attend meetings."
          />
        ) : (
          groups?.map((group) => (
            <GroupMeetings
              key={group.groupId}
              groupId={group.groupId}
              groupName={group.name}
            />
          ))
        )}
      </div>
    </>
  );
}
