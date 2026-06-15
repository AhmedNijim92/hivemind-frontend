"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useComments, useAddComment } from "@/hooks/use-posts";
import { useCurrentUser } from "@/hooks/use-user";
import { useAuthStore } from "@/store/auth-store";
import { timeAgo } from "@/utils/format";
import Link from "next/link";

const schema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500),
});
type FormData = z.infer<typeof schema>;

interface CommentsPanelProps {
  postId: string;
  groupId: string;
}

export function CommentsPanel({ postId, groupId }: CommentsPanelProps) {
  const { data: comments, isLoading } = useComments(postId);
  const addComment = useAddComment();
  const { data: currentUser } = useCurrentUser();
  const userId = useAuthStore((s) => s.userId);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await addComment.mutateAsync({ groupId, postId, data });
    reset();
  };

  const toggleCommentLike = (commentId: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
      {/* Comment list */}
      <div className="space-y-3 max-h-72 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))
        ) : comments?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">
            No comments yet. Be the first!
          </p>
        ) : (
          <AnimatePresence>
            {comments?.map((c) => {
              const isLiked = likedComments.has(c.commentId);
              const displayName = c.authorName === "Unknown" && c.authorId === userId && currentUser?.name
                ? currentUser.name
                : c.authorName === "Unknown" ? "Member" : c.authorName;
              return (
                <motion.div
                  key={c.commentId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5 group"
                >
                  <Link href={`/profile/${c.authorId}`} className="flex-shrink-0 mt-0.5">
                    <Avatar name={displayName !== "Member" ? displayName : undefined} size="xs" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link href={`/profile/${c.authorId}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline mr-1.5">
                        {displayName}
                      </Link>
                      <span className="text-gray-700 dark:text-gray-300">{c.content}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-gray-400">{timeAgo(c.createdAt)}</span>
                      <button
                        onClick={() => toggleCommentLike(c.commentId)}
                        className={`text-[11px] font-semibold transition-colors ${isLiked ? "text-red-500" : "text-gray-400 hover:text-gray-600"}`}
                      >
                        {isLiked ? "Liked" : "Like"}
                      </button>
                      <button className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                        Reply
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCommentLike(c.commentId)}
                    className="self-center opacity-0 group-hover:opacity-100 transition-opacity p-0.5 flex-shrink-0"
                    aria-label={isLiked ? "Unlike comment" : "Like comment"}
                  >
                    <Heart className={`h-3 w-3 transition-all ${isLiked ? "fill-red-500 text-red-500" : "text-gray-300"}`} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Add comment — Instagram style */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <Avatar name={currentUser?.name} src={currentUser?.profilePictureUrl} size="xs" />
        <div className="flex-1 relative">
          <input
            placeholder="Add a comment…"
            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none py-1.5"
            {...register("content")}
          />
        </div>
        <AnimatePresence>
          {/* Show post button only when there's text */}
          <motion.button
            type="submit"
            disabled={addComment.isPending}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-brand-500 hover:text-brand-600 font-semibold text-sm disabled:opacity-50 transition-colors flex-shrink-0"
          >
            Post
          </motion.button>
        </AnimatePresence>
      </form>
      {errors.content && <p className="text-xs text-red-500 pl-8">{errors.content.message}</p>}
    </div>
  );
}
