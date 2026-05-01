"use client";

import { useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { Lightbox } from "@/components/ui/lightbox";
import { useLikePost } from "@/hooks/use-posts";
import { timeAgo, formatNumber } from "@/utils/format";
import type { PostDto } from "@/types";
import { CommentsPanel } from "./comments-panel";
import toast from "react-hot-toast";

interface PostCardProps {
  post: PostDto;
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const likePost = useLikePost();

  const handleLike = useCallback(() => {
    if (liked) return;
    // Optimistic update
    setLiked(true);
    likePost.mutate(
      { groupId: post.groupId, postId: post.postId },
      {
        onError: () => {
          // Revert on failure
          setLiked(false);
          toast.error("Failed to like post");
        },
      }
    );
  }, [liked, likePost, post.groupId, post.postId]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/groups/${post.groupId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.content.slice(0, 100),
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  }, [post]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 space-y-4"
      role="article"
      aria-label={`Post by ${post.authorName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={post.authorName} size="md" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {post.authorName}
            </p>
            <time className="text-xs text-gray-400" dateTime={post.createdAt}>
              {timeAgo(post.createdAt)}
            </time>
          </div>
        </div>
        <button
          className="btn-ghost p-1.5 rounded-lg"
          aria-label="More options for this post"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Media — clickable for lightbox */}
      {post.mediaUrl && (
        <button
          onClick={() => setLightboxOpen(true)}
          className="w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl"
          aria-label="View image full screen"
        >
          <MediaImage src={post.mediaUrl} alt={`Media from ${post.authorName}`} />
        </button>
      )}

      {/* Lightbox */}
      {post.mediaUrl && (
        <Lightbox
          src={post.mediaUrl}
          alt={`Media from ${post.authorName}`}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-1 pt-1 border-t border-gray-100 dark:border-gray-800"
        role="group"
        aria-label="Post actions"
      >
        <button
          onClick={handleLike}
          className={`btn-ghost flex items-center gap-1.5 text-sm transition-colors ${
            liked ? "text-red-500" : ""
          }`}
          aria-label={liked ? "Liked" : "Like post"}
          aria-pressed={liked}
        >
          <Heart
            className={`h-4 w-4 transition-all ${
              liked ? "fill-red-500 text-red-500 scale-110" : ""
            }`}
          />
          <span>{formatNumber(post.likeCount + (liked ? 1 : 0))}</span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="btn-ghost flex items-center gap-1.5 text-sm"
          aria-label={`${post.commentCount} comments. ${showComments ? "Hide" : "Show"} comments`}
          aria-expanded={showComments}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{formatNumber(post.commentCount)}</span>
        </button>

        <button
          onClick={handleShare}
          className="btn-ghost ml-auto"
          aria-label="Share post"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Comments panel */}
      {showComments && (
        <CommentsPanel postId={post.postId} groupId={post.groupId} />
      )}
    </motion.article>
  );
}
