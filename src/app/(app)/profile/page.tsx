"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit2, Check, X, Users, Camera } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { useCurrentUser, useUpdateProfile, useFollowers, useFollowing } from "@/hooks/use-user";
import { useAuthStore } from "@/store/auth-store";
import { mediaService } from "@/services/media.service";
import { formatDate, formatNumber } from "@/utils/format";
import { usePageTitle } from "@/hooks/use-page-title";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  bio: z.string().max(200).optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  usePageTitle("Profile");
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const userId = useAuthStore((s) => s.userId);
  const { data: profile, isLoading } = useCurrentUser();
  const { data: followers } = useFollowers(userId ?? "");
  const { data: following } = useFollowing(userId ?? "");
  const updateProfile = useUpdateProfile();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      name: profile?.name ?? "",
      email: profile?.email ?? "",
      bio: profile?.bio ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    await updateProfile.mutateAsync(data);
    setEditing(false);
  };

  const handleCancel = () => {
    reset();
    setEditing(false);
  };

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max for avatar)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploaded = await mediaService.upload(file, userId ?? undefined, "USER_AVATAR");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const avatarUrl = `${apiBase}/api/v1/media/${uploaded.mediaId}/download`;
      await updateProfile.mutateAsync({ profilePictureUrl: avatarUrl });
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Failed to upload profile picture");
    }
    setUploadingAvatar(false);
  }, [userId, updateProfile]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <>
      <TopBar title="Profile" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="card p-6">
          {/* Avatar + edit button */}
          <div className="flex items-start justify-between mb-5">
            <div className="relative group">
              <Avatar
                name={profile?.name}
                src={profile?.profilePictureUrl}
                size="xl"
              />
              {/* Avatar upload overlay */}
              <label
                className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center cursor-pointer transition-all"
                aria-label="Change profile picture"
              >
                <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  aria-label="Cancel editing"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSubmit(onSubmit)}
                  loading={updateProfile.isPending}
                  aria-label="Save changes"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <form className="space-y-4">
              <Input
                label="Name"
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Textarea
                label="Bio"
                placeholder="Tell people about yourself…"
                error={errors.bio?.message}
                {...register("bio")}
              />
            </form>
          ) : (
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile?.name}
              </h1>
              {profile?.bio && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {profile.bio}
                </p>
              )}
              <p className="text-gray-400 text-sm">{profile?.email}</p>
              <p className="text-gray-400 text-sm">{profile?.mobileNumber}</p>
              {profile?.createdAt && (
                <p className="text-gray-400 text-xs">
                  Joined {formatDate(profile.createdAt)}
                </p>
              )}
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
              <Users className="h-4 w-4" />
              Followers
            </h2>
            <div className="space-y-3">
              {followers.slice(0, 5).map((f) => (
                <Link
                  key={f.userId}
                  href={`/profile/${f.userId}`}
                  className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl p-2 -mx-2 transition-colors"
                >
                  <Avatar name={f.name} src={f.profilePictureUrl} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {f.name}
                    </p>
                    <p className="text-xs text-gray-400">{f.mobileNumber}</p>
                  </div>
                </Link>
              ))}
              {followers.length > 5 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  +{followers.length - 5} more followers
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
