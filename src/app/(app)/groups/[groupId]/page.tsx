"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users, Lock, Globe, Plus, Video, ArrowLeft, UserMinus, UserPlus,
  FileText, Calendar, MessageCircle, Share2, Crown, Shield, User,
  Heart, Bell, CheckCircle, XCircle, Clock, UserCheck, Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useOpenGroupChat } from "@/hooks/use-chat";
import { useGroupFollow, useJoinRequest, usePendingRequests } from "@/hooks/use-group-social";
import { useUIStore } from "@/store/ui-store";
import { useGroupContextStore } from "@/store/group-context-store";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber, timeAgo } from "@/utils/format";
import { usePageTitle } from "@/hooks/use-page-title";
import { mediaService } from "@/services/media.service";
import { groupService } from "@/services/group.service";
import toast from "react-hot-toast";

type Tab = "posts" | "chat" | "meetings" | "members" | "requests";

const roleIcon = { ADMIN: Crown, MODERATOR: Shield, MEMBER: User } as const;
const roleColor = { ADMIN: "text-yellow-500", MODERATOR: "text-blue-500", MEMBER: "text-gray-400" } as const;

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const [tab, setTab] = useState<Tab>("posts");
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: posts, isLoading: postsLoading } = useGroupPosts(groupId);
  const { data: meetings } = useGroupMeetings(groupId);
  const { data: members } = useGroupMembers(groupId);
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const { openCreatePost } = useUIStore();
  const userId = useAuthStore((s) => s.userId);
  const openGroupChat = useOpenGroupChat();

  // Group social features
  const { isFollowing, followerCount, toggle: toggleFollow } = useGroupFollow(groupId);
  const { requestStatus, sendRequest } = useJoinRequest(groupId);
  const { pendingRequests, pendingCount, approve, reject } = usePendingRequests(groupId);

  const isMember = members?.some((m) => m.userId === userId);
  const isCreator = group?.creatorId === userId;
  const isAdmin = members?.some((m) => m.userId === userId && m.role === "ADMIN");
  const isPrivate = group?.privacy === "PRIVATE";

  usePageTitle(group?.name ?? "Group");

  const handleCreatePost = () => {
    if (group) {
      useGroupContextStore.getState().setActiveGroup(group);
    }
    openCreatePost();
  };
  const handleOpenChat = () => {
    if (!group || !members) return;
    const ids = members.map((m) => m.userId);
    const names: Record<string, string> = {};
    const avatars: Record<string, string | null> = {};
    members.forEach((m) => { names[m.userId] = m.userId === userId ? "You" : m.userId; avatars[m.userId] = null; });
    openGroupChat(groupId, group.name, ids, names, avatars);
  };
  const handleShare = async () => {
    const url = `${window.location.origin}/groups/${groupId}`;
    if (navigator.share) { try { await navigator.share({ title: group?.name, url }); } catch {} }
    else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
  };

  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max file size is 10MB"); return; }
    setUploadingCover(true);
    try {
      const uploaded = await mediaService.upload(file, groupId, "GROUP");
      const coverUrl = `/api/v1/media/${uploaded.mediaId}/download`;
      await groupService.updateGroup(groupId, { coverPictureUrl: coverUrl });
      toast.success("Cover photo updated!");
    } catch { toast.error("Upload failed"); }
    setUploadingCover(false);
  }, [groupId]);

  // For private groups: handle join request vs direct join
  const handleJoinAction = () => {
    if (isPrivate) {
      sendRequest();
    } else {
      joinGroup.mutate(groupId);
    }
  };

  if (groupLoading) return <div className="max-w-2xl mx-auto px-4 py-6 space-y-4"><div className="skeleton h-48 rounded-2xl" /><PostSkeleton /></div>;

  if (!group) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-400">Group not found.</p>
      <Link href="/groups" className="text-brand-500 text-sm mt-2 block">← Back</Link>
    </div>
  );

  const availableTabs: Tab[] = isAdmin
    ? ["posts", "chat", "meetings", "members", "requests"]
    : ["posts", "chat", "meetings", "members"];

  const tabCounts: Record<Tab, number> = {
    posts: posts?.length ?? 0,
    chat: 0,
    meetings: meetings?.length ?? 0,
    members: members?.length ?? 0,
    requests: pendingCount,
  };

  return (
    <>
      <TopBar />
      <div className="max-w-2xl mx-auto">
        {/* Animated cover */}
        <div className="h-44 sm:h-56 relative overflow-hidden">
          {group.coverPictureUrl ? (
            <Image src={group.coverPictureUrl} alt="Cover" fill className="object-cover" priority />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400 via-brand-600 to-purple-700" />
              <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-4 right-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <motion.div animate={{ x: [0, -40, 0], y: [0, 25, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 left-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          <Link href="/groups" className="absolute top-3 left-3 z-10 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button onClick={handleShare} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white transition-colors" aria-label="Share">
            <Share2 className="h-5 w-5" />
          </button>

          {/* Cover upload button for admins */}
          {isAdmin && (
            <label className="absolute bottom-3 right-3 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium cursor-pointer hover:bg-black/70 transition-colors">
              <Camera className="h-4 w-4" />
              {uploadingCover ? "Uploading…" : "Edit cover"}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
            </label>
          )}
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
              <div className="h-8 w-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Group identity on cover */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl flex-shrink-0">
              <span className="text-white font-bold text-3xl">{group.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg truncate">{group.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                  {group.privacy === "PUBLIC" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {group.privacy}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-5 pb-8">
          {/* Info card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5 -mt-4 relative z-10 backdrop-blur-sm bg-white/95 dark:bg-surface-dark-2/95">
            {group.description && <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{group.description}</p>}

            {/* Stats row */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-lg">{formatNumber(group.memberCount)}</span>
                <span className="text-gray-500 ml-1">Members</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-lg">{formatNumber(followerCount)}</span>
                <span className="text-gray-500 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-lg">{formatNumber(posts?.length ?? 0)}</span>
                <span className="text-gray-500 ml-1">Posts</span>
              </div>
            </div>

            {/* Member avatars */}
            {members && members.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <div className="flex -space-x-2">
                  {members.slice(0, 6).map((m) => (
                    <div key={m.userId} className="ring-2 ring-white dark:ring-surface-dark-2 rounded-full">
                      <Avatar name={m.userId} size="xs" />
                    </div>
                  ))}
                  {members.length > 6 && (
                    <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-surface-dark-2 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-500">+{members.length - 6}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400">Created {timeAgo(group.createdAt)}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              {isMember ? (
                <>
                  <Button onClick={handleCreatePost} className="flex-1"><Plus className="h-4 w-4" /> Post</Button>
                  <Button variant="outline" onClick={handleOpenChat}><MessageCircle className="h-4 w-4" /></Button>
                  <Button variant={isFollowing ? "secondary" : "outline"} onClick={toggleFollow}>
                    <Heart className={`h-4 w-4 ${isFollowing ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  {!isCreator && (
                    <Button variant="ghost" onClick={() => leaveGroup.mutate(groupId)} loading={leaveGroup.isPending}>
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Follow button (always available) */}
                  <Button variant={isFollowing ? "secondary" : "outline"} onClick={toggleFollow}>
                    <Heart className={`h-4 w-4 ${isFollowing ? "fill-red-500 text-red-500" : ""}`} />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>

                  {/* Join / Request button */}
                  {isPrivate ? (
                    requestStatus === "pending" ? (
                      <Button variant="secondary" className="flex-1" disabled>
                        <Clock className="h-4 w-4" /> Request Pending
                      </Button>
                    ) : requestStatus === "rejected" ? (
                      <Button variant="secondary" className="flex-1" disabled>
                        <XCircle className="h-4 w-4" /> Request Declined
                      </Button>
                    ) : (
                      <Button className="flex-1" onClick={handleJoinAction}>
                        <UserPlus className="h-4 w-4" /> Request to Join
                      </Button>
                    )
                  ) : (
                    <Button className="flex-1" onClick={handleJoinAction} loading={joinGroup.isPending}>
                      <UserPlus className="h-4 w-4" /> Join Group
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Admin: pending requests alert */}
            {isAdmin && pendingCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setTab("requests")}
                className="w-full mt-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 flex items-center gap-3 text-left hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    {pendingCount} pending join request{pendingCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Tap to review</p>
                </div>
                <Badge variant="warning">{pendingCount}</Badge>
              </motion.button>
            )}
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 sticky top-0 z-20 overflow-x-auto scrollbar-hide" role="tablist">
            {availableTabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} role="tab" aria-selected={tab === t}
                className={`flex-1 min-w-0 py-2.5 rounded-lg text-sm font-medium transition-all capitalize flex items-center justify-center gap-1 ${
                  tab === t ? "bg-white dark:bg-surface-dark-2 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <span className="truncate">{t}</span>
                {tabCounts[t] > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    t === "requests" ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300" :
                    tab === t ? "bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}>
                    {tabCounts[t]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === "posts" && (
                <div className="space-y-4">
                  {postsLoading ? Array.from({ length: 2 }).map((_, i) => <PostSkeleton key={i} />) :
                    posts?.length === 0 ? <EmptyState icon={FileText} title="No posts yet" description={isMember ? "Be the first to share!" : "Join to start posting."} actionLabel={isMember ? "Create a post" : undefined} onAction={isMember ? handleCreatePost : undefined} /> :
                    posts?.map((post) => <PostCard key={post.postId} post={{ ...post, groupName: post.groupName || group.name }} />)}
                </div>
              )}

              {tab === "chat" && (
                isMember ? (
                  <div className="card p-8 text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Group Chat</h3>
                      <p className="text-sm text-gray-500 mt-1">Chat with all {formatNumber(group.memberCount)} members</p>
                    </div>
                    <Button onClick={handleOpenChat} className="mx-auto"><MessageCircle className="h-4 w-4" /> Open Chat</Button>
                  </div>
                ) : <EmptyState icon={MessageCircle} title="Members only" description="Join the group to access chat." />
              )}

              {tab === "meetings" && (
                <div className="space-y-3">
                  {isMember && <Button variant="secondary" className="w-full" onClick={() => setShowCreateMeeting(true)}><Video className="h-4 w-4" /> Schedule Meeting</Button>}
                  {meetings?.length === 0 ? <EmptyState icon={Calendar} title="No meetings" description={isMember ? "Schedule one!" : "Join to schedule."} actionLabel={isMember ? "Schedule" : undefined} onAction={isMember ? () => setShowCreateMeeting(true) : undefined} /> :
                    meetings?.map((m) => <MeetingCard key={m.meetingId} meeting={m} />)}
                  <CreateMeetingModal open={showCreateMeeting} onClose={() => setShowCreateMeeting(false)} groupId={groupId} />
                </div>
              )}

              {tab === "members" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members?.length === 0 ? <div className="col-span-2"><EmptyState icon={Users} title="No members" /></div> :
                    members?.map((member) => {
                      const RoleIcon = roleIcon[member.role as keyof typeof roleIcon] ?? User;
                      const color = roleColor[member.role as keyof typeof roleColor] ?? "text-gray-400";
                      return (
                        <Link key={member.userId} href={`/profile/${member.userId}`} className="card p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          <Avatar name={member.userId} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{member.userId.slice(0, 8)}…</p>
                              <RoleIcon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                            </div>
                            <p className="text-xs text-gray-400">Joined {timeAgo(member.joinedAt)}</p>
                          </div>
                          <Badge variant={member.role === "ADMIN" ? "brand" : member.role === "MODERATOR" ? "success" : "default"} className="text-[10px]">{member.role}</Badge>
                        </Link>
                      );
                    })}
                </div>
              )}

              {tab === "requests" && isAdmin && (
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <EmptyState icon={UserCheck} title="No pending requests" description="All join requests have been reviewed." />
                  ) : (
                    pendingRequests.map((req) => (
                      <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center gap-3">
                        <Avatar name={req.userName} src={req.userAvatar} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{req.userName}</p>
                          <p className="text-xs text-gray-400">Requested {timeAgo(req.createdAt)}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" onClick={() => approve(req.id)}>
                            <CheckCircle className="h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => reject(req.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
