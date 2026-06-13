"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Edit2, Check, X, Users, Camera, Mail, Phone, Calendar,
  Settings, Grid3X3, Heart, UserCheck, Bell,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useUpdateProfile } from "@/hooks/use-user";
import { useMyGroups } from "@/hooks/use-groups";
import { useFriendList, usePendingFriendRequests } from "@/hooks/use-friends";
import { useAuthStore } from "@/store/auth-store";
import { useGroupSocialStore } from "@/store/group-social-store";
import { mediaService } from "@/services/media.service";
import { formatDate, formatNumber, timeAgo } from "@/utils/format";
import { usePageTitle } from "@/hooks/use-page-title";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  bio: z.string().max(200).optional(),
});
type FormData = z.infer<typeof schema>;
type ProfileTab = "groups" | "friends" | "requests";

export default function ProfilePage() {
  usePageTitle("Profile");
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("groups");
  const userId = useAuthStore((s) => s.userId);
  const { data: profile, isLoading } = useCurrentUser();
  const { data: groups } = useMyGroups();
  const updateProfile = useUpdateProfile();
  const { count: friendCount } = useFriendList(userId ?? "");
  const { pending: pendingRequests, count: pendingCount, accept, reject } = usePendingFriendRequests();
  const getGroupsFollowedByUser = useGroupSocialStore((s) => s.getGroupsFollowedByUser);
  const followedGroupIds = userId ? getGroupsFollowedByUser(userId) : [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { name: profile?.name ?? "", email: profile?.email ?? "", bio: profile?.bio ?? "" },
  });

  const onSubmit = async (data: FormData) => { await updateProfile.mutateAsync(data); setEditing(false); };

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploadingAvatar(true);
    try {
      const uploaded = await mediaService.upload(file, userId ?? undefined, "USER_AVATAR");
      await updateProfile.mutateAsync({ profilePictureUrl: `/api/v1/media/${uploaded.mediaId}/download` });
      toast.success("Updated!");
    } catch { toast.error("Upload failed"); }
    setUploadingAvatar(false);
  }, [userId, updateProfile]);

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-6"><ProfileSkeleton /></div>;

  return (
    <>
      <TopBar title="Profile" />
      <div className="max-w-2xl mx-auto">
        {/* Cover */}
        <div className="h-40 sm:h-52 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-purple-600 to-pink-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-8 right-12 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <motion.div animate={{ x: [0, -20, 0], y: [0, 15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-4 left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        </div>

        <div className="px-4 -mt-20 relative z-10 space-y-6 pb-8">
          {/* Profile card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 backdrop-blur-sm bg-white/95 dark:bg-surface-dark-2/95">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative group -mt-16 sm:-mt-20 self-center sm:self-auto">
                <div className="ring-4 ring-white dark:ring-surface-dark-2 rounded-full shadow-xl">
                  <Avatar name={profile?.name} src={profile?.profilePictureUrl} size="xl" className="h-24 w-24 sm:h-28 sm:w-28 text-3xl" />
                </div>
                <label className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center cursor-pointer transition-all duration-300">
                  <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
                {uploadingAvatar && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white dark:ring-surface-dark-2" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.name}</h1>
                {profile?.bio && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-md">{profile.bio}</p>}
              </div>
              <div className="flex gap-2 self-center sm:self-auto">
                <Link href="/settings"><Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button></Link>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit2 className="h-4 w-4" /> Edit</Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => { reset(); setEditing(false); }}><X className="h-4 w-4" /></Button>
                    <Button size="sm" onClick={handleSubmit(onSubmit)} loading={updateProfile.isPending}><Check className="h-4 w-4" /> Save</Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              {profile?.email && <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full"><Mail className="h-3 w-3" />{profile.email}</span>}
              {profile?.mobileNumber && <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full"><Phone className="h-3 w-3" />{profile.mobileNumber}</span>}
              {profile?.createdAt && <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full"><Calendar className="h-3 w-3" />Joined {formatDate(profile.createdAt)}</span>}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
              {[
                { label: "Friends", value: friendCount, icon: UserCheck },
                { label: "Groups", value: groups?.length ?? 0, icon: Users },
                { label: "Following", value: followedGroupIds.length, icon: Heart },
              ].map((stat) => (
                <motion.div key={stat.label} whileHover={{ scale: 1.05 }} className="text-center p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-default">
                  <stat.icon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(stat.value)}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Pending friend requests alert */}
            {pendingCount > 0 && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setActiveTab("requests")}
                className="w-full mt-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 flex items-center gap-3 text-left hover:bg-brand-100 dark:hover:bg-brand-950/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">{pendingCount} friend request{pendingCount > 1 ? "s" : ""}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400">Tap to review</p>
                </div>
                <Badge variant="brand">{pendingCount}</Badge>
              </motion.button>
            )}
          </motion.div>

          <AnimatePresence>
            {editing && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="card p-5 space-y-4">
                  <Input label="Name" error={errors.name?.message} {...register("name")} />
                  <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
                  <Textarea label="Bio" placeholder="Tell people about yourself…" error={errors.bio?.message} {...register("bio")} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1" role="tablist">
            {(["groups", "friends", "requests"] as ProfileTab[]).map((t) => {
              const count = t === "groups" ? groups?.length ?? 0 : t === "friends" ? friendCount : pendingCount;
              return (
                <button key={t} onClick={() => setActiveTab(t)} role="tab" aria-selected={activeTab === t}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize flex items-center justify-center gap-1 ${
                    activeTab === t ? "bg-white dark:bg-surface-dark-2 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  {t}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      t === "requests" && count > 0 ? "bg-brand-100 dark:bg-brand-900 text-brand-600" :
                      activeTab === t ? "bg-gray-200 dark:bg-gray-700 text-gray-600" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {activeTab === "groups" && (
                <div className="grid grid-cols-2 gap-3">
                  {!groups?.length ? <div className="col-span-2"><EmptyState emoji="🐝" title="No groups yet" description="Join or create a group." /></div> :
                    groups.map((g) => (
                      <Link key={g.groupId} href={`/groups/${g.groupId}`} className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-3">
                          <span className="text-white font-bold text-sm">{g.name[0].toUpperCase()}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{g.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatNumber(g.memberCount)} members</p>
                      </Link>
                    ))}
                </div>
              )}

              {activeTab === "friends" && (
                <div className="card overflow-hidden">
                  {friendCount === 0 ? (
                    <EmptyState icon={UserCheck} title="No friends yet" description="Send friend requests to connect with people." />
                  ) : (
                    <p className="p-6 text-center text-sm text-gray-500">You have {friendCount} friend{friendCount !== 1 ? "s" : ""}.</p>
                  )}
                </div>
              )}

              {activeTab === "requests" && (
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <EmptyState icon={Bell} title="No pending requests" description="You're all caught up!" />
                  ) : (
                    pendingRequests.map((req) => (
                      <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center gap-3">
                        <Avatar name={req.fromUserName} src={req.fromUserAvatar} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{req.fromUserName}</p>
                          <p className="text-xs text-gray-400">{timeAgo(req.createdAt)}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" onClick={() => accept(req.id)}>Accept</Button>
                          <Button size="sm" variant="ghost" onClick={() => reject(req.id)}>Decline</Button>
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
