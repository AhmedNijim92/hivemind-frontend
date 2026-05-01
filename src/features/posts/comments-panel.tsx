"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useComments, useAddComment } from "@/hooks/use-posts";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { timeAgo } from "@/utils/format";

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await addComment.mutateAsync({ groupId, postId, data });
    reset();
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Comment list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          ))
        ) : comments?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">
            No comments yet. Be the first!
          </p>
        ) : (
          comments?.map((c) => (
            <div key={c.commentId} className="flex gap-2.5">
              <Avatar name={c.authorName} size="xs" className="mt-0.5" />
              <div className="bg-gray-50 dark:bg-surface-dark-3 rounded-xl px-3 py-2 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {c.authorName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                  {c.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-center">
        <Avatar name={currentUser?.name} size="xs" />
        <div className="flex-1 relative">
          <input
            placeholder="Write a comment…"
            className="input-base py-2 pr-10 text-sm"
            {...register("content")}
          />
          <button
            type="submit"
            disabled={addComment.isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-500 hover:text-brand-600 disabled:opacity-50"
            aria-label="Send comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
      {errors.content && (
        <p className="text-xs text-red-500">{errors.content.message}</p>
      )}
    </div>
  );
}
