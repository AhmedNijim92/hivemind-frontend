"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Users,
  Lock,
  Globe,
  Plus,
  Video,
  ArrowLeft,
  UserMinus,
  UserPlus,
  FileText,
  Calendar,
} from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { PostCard } from "@/features/posts/post-card";
import { MeetingCard } from "@/features/meetings/meeting-card";
import { CreateMeetingModal } from "@/features/meetings/create-meeting-modal";
import { PostSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useGroup, useGroupMembers, useJoinGroup, useLeaveGroup } from "@/hooks/use-groups";
import { useGroupPosts } from "@/hooks/use-posts";
import { useGroupMeetings } from "@/hooks/use-meetings";
import { useUIStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber, timeAgo } from "@/utils/format";
import { usePageTitle } from "@/hooks/use-page-title";

type Tab = "posts" | "meetings" | "members";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const [tab, setTab] = useState<Tab>("posts");
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);

  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: posts, isLoading: postsLoading } = useGroupPosts(groupId);
  const { data: meetings } = useGroupMeetings(groupId);
  const { data: members } = useGroupMembers(groupId);
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const { openCreatePost, setActiveGroupId } = useUIStore();
  const userId = useAuthStore((s) => s.userId);

  const isMember = members?.some((m) => m.userId === userId);
  const isCreator = group?.creatorId === userId;

  usePageTitle(group?.name ?? "Group");

  const handleCreatePost = () => {
    setActiveGroupId(groupId);
    openCreatePost();
  };

  if (groupLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="skeleton h-32 rounded-2xl" />
        <PostSkeleton />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Group not found.</p>
        <Link href="/groups" className="text-brand-500 text-sm mt-2 block">
          ← Back to groups
        </Link>
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Back */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Groups
        </Link>

        {/* Group header */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {group.name[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {group.name}
                </h1>
                <Badge variant={group.privacy === "PUBLIC" ? "default" : "brand"}>
                  {group.privacy === "PUBLIC" ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {group.privacy}
                </Badge>
              </div>
              {group.description && (
                <p className="text-gray-500 text-sm mt-1">{group.description}</p>
              )}
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-400">
                <Users className="h-4 w-4" />
                <span>{formatNumber(group.memberCount)} members</span>
                <span className="mx-1">·</span>
                <span>Created {timeAgo(group.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {isMember ? (
              <>
                <Button onClick={handleCreatePost} className="flex-1">
                  <Plus className="h-4 w-4" />
                  Post
                </Button>
                {!isCreator && (
                  <Button
                    variant="outline"
                    onClick={() => leaveGroup.mutate(groupId)}
                    loading={leaveGroup.isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                    Leave
                  </Button>
                )}
              </>
            ) : (
              <Button
                className="flex-1"
                onClick={() => joinGroup.mutate(groupId)}
                loading={joinGroup.isPending}
              >
                <UserPlus className="h-4 w-4" />
                Join Group
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1" role="tablist">
          {(["posts", "meetings", "members"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              role="tab"
              aria-selected={tab === t}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t
                  ? "bg-white dark:bg-surface-dark-2 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "posts" && (
          <div className="space-y-4" role="tabpanel" aria-label="Posts">
            {postsLoading ? (
              Array.from({ length: 2 }).map((_, i) => <PostSkeleton key={i} />)
            ) : posts?.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No posts yet"
                description={
                  isMember
                    ? "Be the first to share something with the group!"
                    : "Join this group to start posting."
                }
                actionLabel={isMember ? "Create a post" : undefined}
                onAction={isMember ? handleCreatePost : undefined}
              />
            ) : (
              posts?.map((post) => <PostCard key={post.postId} post={post} />)
            )}
          </div>
        )}

        {tab === "meetings" && (
          <div className="space-y-3" role="tabpanel" aria-label="Meetings">
            {isMember && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowCreateMeeting(true)}
              >
                <Video className="h-4 w-4" />
                Schedule Meeting
              </Button>
            )}
            {meetings?.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No meetings scheduled"
                description={
                  isMember
                    ? "Schedule a meeting to connect with group members."
                    : "Join this group to schedule meetings."
                }
                actionLabel={isMember ? "Schedule a meeting" : undefined}
                onAction={isMember ? () => setShowCreateMeeting(true) : undefined}
              />
            ) : (
              meetings?.map((m) => (
                <MeetingCard key={m.meetingId} meeting={m} />
              ))
            )}

            <CreateMeetingModal
              open={showCreateMeeting}
              onClose={() => setShowCreateMeeting(false)}
              groupId={groupId}
            />
          </div>
        )}

        {tab === "members" && (
          <div className="card divide-y divide-gray-100 dark:divide-gray-800" role="tabpanel" aria-label="Members">
            {members?.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No members yet"
                description="Be the first to join this group!"
              />
            ) : (
              members?.map((member) => (
                <Link
                  key={member.userId}
                  href={`/profile/${member.userId}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-surface-dark-3 transition-colors"
                >
                  <Avatar name={member.userId} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.userId}
                    </p>
                    <p className="text-xs text-gray-400">
                      {member.role} · Joined {timeAgo(member.joinedAt)}
                    </p>
                  </div>
                  <Badge
                    variant={member.role === "ADMIN" ? "brand" : "default"}
                  >
                    {member.role}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
