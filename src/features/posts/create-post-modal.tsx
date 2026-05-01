"use client";

import { useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useCreatePost } from "@/hooks/use-posts";
import { useCurrentUser } from "@/hooks/use-user";
import { mediaService } from "@/services/media.service";
import { useUIStore } from "@/store/ui-store";
import { formatFileSize } from "@/utils/format";
import toast from "react-hot-toast";

const MAX_CHARS = 2000;

const schema = z.object({
  content: z.string().min(1, "Post content is required").max(MAX_CHARS),
});
type FormData = z.infer<typeof schema>;

export function CreatePostModal() {
  const { isCreatePostOpen, closeCreatePost, activeGroupId } = useUIStore();
  const { data: currentUser } = useCurrentUser();
  const createPost = useCreatePost();

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  // Watch content for character counter
  const content = useWatch({ control, name: "content" });
  const charCount = content?.length ?? 0;
  const charPercent = (charCount / MAX_CHARS) * 100;

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!activeGroupId) {
      toast.error("Select a group first");
      return;
    }

    let mediaUrl: string | undefined;

    if (mediaFile) {
      setUploading(true);
      try {
        const uploaded = await mediaService.upload(mediaFile, undefined, "POST");
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        mediaUrl = `${apiBase}/api/v1/media/${uploaded.mediaId}/download`;
      } catch {
        toast.error("Media upload failed — posting without image");
      }
      setUploading(false);
    }

    await createPost.mutateAsync({
      groupId: activeGroupId,
      content: data.content,
      mediaUrl,
    });

    reset();
    removeMedia();
    closeCreatePost();
  };

  const handleClose = () => {
    reset();
    removeMedia();
    closeCreatePost();
  };

  return (
    <Modal open={isCreatePostOpen} onClose={handleClose} title="Create post">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar name={currentUser?.name} size="md" src={currentUser?.profilePictureUrl} />
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {currentUser?.name ?? "You"}
            </p>
            <p className="text-xs text-gray-400">Posting to group</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <Textarea
            placeholder="What's on your mind?"
            className="min-h-[120px] text-base border-0 bg-transparent p-0 focus:ring-0 resize-none"
            error={errors.content?.message}
            {...register("content")}
          />
          {/* Character counter */}
          <div className="flex items-center justify-end gap-2 mt-1">
            {charCount > MAX_CHARS * 0.8 && (
              <div className="relative h-5 w-5">
                <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${Math.min(charPercent, 100) * 0.5027} 50.27`}
                    className={charCount > MAX_CHARS ? "text-red-500" : charCount > MAX_CHARS * 0.9 ? "text-yellow-500" : "text-brand-500"}
                  />
                </svg>
              </div>
            )}
            <span className={`text-xs font-medium ${
              charCount > MAX_CHARS ? "text-red-500" : charCount > MAX_CHARS * 0.9 ? "text-yellow-500" : "text-gray-400"
            }`}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Media preview */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaPreview}
              alt="Preview"
              className="w-full max-h-64 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
              aria-label="Remove media"
            >
              <X className="h-4 w-4" />
            </button>
            {/* File info */}
            {mediaFile && (
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                {formatFileSize(mediaFile.size)}
              </div>
            )}
          </div>
        )}

        {/* Dropzone */}
        {!mediaPreview && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                : "border-gray-200 dark:border-gray-700 hover:border-brand-400"
            }`}
          >
            <input {...getInputProps()} aria-label="Upload media" />
            <ImagePlus className="h-6 w-6 mx-auto text-gray-400 mb-1" />
            <p className="text-sm text-gray-400">
              {isDragActive ? "Drop here" : "Add photo or video"}
            </p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
              Max 50MB
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={createPost.isPending || uploading}
            disabled={charCount === 0 || charCount > MAX_CHARS}
          >
            {uploading ? "Uploading…" : "Post"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
