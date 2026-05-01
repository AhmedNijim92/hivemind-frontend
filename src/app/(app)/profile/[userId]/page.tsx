"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, UserMinus, Users } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { useProfile, useFollowers, useFollowing, useFollowUser, useUnfollowUser } from "@/hooks/use-user";
import { useAuthStore } from "@/store/auth-store";
import { formatDate, formatNumber } from "@/utils/format";
import { usePageTitle } from "@/hooks/use-page-title";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const currentUserId = useAuthStore((s) => s.userId);
  const isOwnProfile = userId === currentUserId;

  const { data: profile, isLoading } = useProfile(userId);
  const { data: followers } = useFollowers(userId);
  const { data: following } = useFollowing(userId);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const isFollowing = followers?.some((f) => f.userId === currentUserId);

  usePageTitle(profile?.name ?? "Profile");

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">User not found.</p>
        <Link href="/feed" className="text-brand-500 text-sm mt-2 block">← Back to feed</Link>
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="card p-6">
          <div className="flex items-start gap-4">
            <Avatar name={profile.name} src={profile.profilePictureUrl} size="xl" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              {profile.bio && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{profile.bio}</p>}
              <p className="text-gray-400 text-sm mt-1">{profile.mobileNumber}</p>
              {profile.createdAt && (
                <p className="text-gray-400 text-xs mt-1">Joined {formatDate(profile.createdAt)}</p>
              )}
            </div>
          </div>

          {/* Follow/Unfollow */}
          {!isOwnProfile && (
            <div className="mt-4">
              {isFollowing ? (
                <Button
                  variant="secondary"
                  onClick={() => unfollowUser.mutate(userId)}
                  loading={unfollowUser.isPending}
                >
                  <UserMinus className="h-4 w-4" /> Unfollow
                </Button>
              ) : (
                <Button
                  onClick={() => followUser.mutate(userId)}
                  loading={followUser.isPending}
                >
                  <UserPlus className="h-4 w-4" /> Follow
                </Button>
              )}
            </div>
          )}

          {isOwnProfile && (
            <div className="mt-4">
              <Link href="/profile">
                <Button variant="outline" size="sm">Edit profile</Button>
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                {formatNumber(followers?.length ?? 0)}
              </p>
              <p className="text-xs text-gray-400">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 dark:text-white text-lg">
                {formatNumber(following?.length ?? 0)}
              </p>
              <p className="text-xs text-gray-400">Following</p>
            </div>
          </div>
        </div>

        {/* Followers list */}
        {followers && followers.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" /> Followers
            </h2>
            <div className="space-y-3">
              {followers.map((f) => (
                <Link key={f.userId} href={`/profile/${f.userId}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl p-2 -mx-2 transition-colors">
                  <Avatar name={f.name} src={f.profilePictureUrl} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.mobileNumber}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
