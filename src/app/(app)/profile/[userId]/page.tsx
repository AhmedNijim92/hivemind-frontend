"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Users, Phone, Calendar, MessageCircle, Share2,
  UserPlus, UserCheck, UserX, Clock, UserMinus,
} from "lucide-react";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-user";
import { useMyGroups } from "@/hooks/use-groups";
import { useFriendship, useFriendList } from "@/hooks/use-friends";
import { useStartConversation } from "@/hooks/use-chat";
import { useAuthStore } from "@/store/auth-store";
import { useFriendStore } from "@/store/friend-store";
import { formatDate, formatNumber } from "@/utils/format";
import { usePageTitle } from "@/hooks/use-page-title";
import toast from "react-hot-toast";

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const currentUserId = useAuthStore((s) => s.userId);
  const isOwnProfile = userId === currentUserId;

  const { data: profile, isLoading } = useProfile(userId);
  const { data: myGroups } = useMyGroups();
  const { count: friendCount } = useFriendList(userId);
  const {
    isFriend, requestStatus, pendingRequest, iSentRequest, theySentRequest,
    sendFriendRequest, unfriend,
  } = useFriendship(userId);
  const acceptRequest = useFriendStore((s) => s.acceptRequest);
  const startConversation = useStartConversation();

  usePageTitle(profile?.name ?? "Profile");

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${userId}`;
    if (navigator.share) { try { await navigator.share({ title: profile?.name, url }); } catch {} }
    else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
  };

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-6"><ProfileSkeleton /></div>;
  if (!profile) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-400">User not found.</p>
      <Link href="/feed" className="text-brand-500 text-sm mt-2 block">← Back</Link>
    </div>
  );

  return (
    <>
      <TopBar />
      <div className="max-w-2xl mx-auto">
        {/* Cover */}
        <div className="h-40 sm:h-52 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-brand-500 to-pink-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <motion.div animate={{ x: [0, 40, 0], y: [0, -25, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-6 right-16 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <motion.div animate={{ x: [0, -30, 0], y: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-2 left-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <Link href="/feed" className="absolute top-3 left-3 z-10 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <button onClick={handleShare} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white transition-colors" aria-label="Share"><Share2 className="h-5 w-5" /></button>
        </div>

        <div className="px-4 -mt-20 relative z-10 space-y-5 pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 backdrop-blur-sm bg-white/95 dark:bg-surface-dark-2/95">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="-mt-16 sm:-mt-20 self-center sm:self-auto">
                <div className="ring-4 ring-white dark:ring-surface-dark-2 rounded-full shadow-xl relative">
                  <Avatar name={profile.name} src={profile.profilePictureUrl} size="xl" className="h-24 w-24 sm:h-28 sm:w-28 text-3xl" />
                  <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white dark:ring-surface-dark-2" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                  {isFriend && <Badge variant="success" className="text-[10px]"><UserCheck className="h-3 w-3" /> Friends</Badge>}
                </div>
                {profile.bio && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-md">{profile.bio}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-2 self-center sm:self-auto flex-wrap justify-center">
                {isOwnProfile ? (
                  <Link href="/profile"><Button variant="outline" size="sm">Edit profile</Button></Link>
                ) : (
                  <>
                    {/* Message button */}
                    <Button variant="outline" size="sm" onClick={() => startConversation(userId, profile.name, profile.profilePictureUrl)}>
                      <MessageCircle className="h-4 w-4" /> Message
                    </Button>

                    {/* Friend action */}
                    {isFriend ? (
                      <Button variant="secondary" size="sm" onClick={unfriend}>
                        <UserMinus className="h-4 w-4" /> Unfriend
                      </Button>
                    ) : theySentRequest && pendingRequest ? (
                      <Button size="sm" onClick={() => { acceptRequest(pendingRequest.id); toast.success("Friend request accepted!"); }}>
                        <UserCheck className="h-4 w-4" /> Accept Request
                      </Button>
                    ) : iSentRequest ? (
                      <Button variant="secondary" size="sm" disabled>
                        <Clock className="h-4 w-4" /> Request Sent
                      </Button>
                    ) : requestStatus === "rejected" ? (
                      <Button variant="secondary" size="sm" disabled>
                        <UserX className="h-4 w-4" /> Declined
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => sendFriendRequest(profile.name, profile.profilePictureUrl)}>
                        <UserPlus className="h-4 w-4" /> Add Friend
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {profile.mobileNumber && <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full"><Phone className="h-3 w-3" />{profile.mobileNumber}</span>}
              {profile.createdAt && <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full"><Calendar className="h-3 w-3" />Joined {formatDate(profile.createdAt)}</span>}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(friendCount)}</span>
                <span className="text-sm text-gray-500 ml-1.5">Friends</span>
              </div>
            </div>

            {/* Mutual info */}
            {!isOwnProfile && isFriend && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-green-500" />
                  You and {profile.name} are friends
                </p>
              </div>
            )}
          </motion.div>

          {/* Groups */}
          {myGroups && myGroups.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-500" /> Groups
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {myGroups.slice(0, 4).map((g) => (
                  <Link key={g.groupId} href={`/groups/${g.groupId}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">{g.name[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{g.name}</p>
                      <p className="text-[10px] text-gray-400">{formatNumber(g.memberCount)} members</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
