"use client";

import { useState, useCallback, useRef } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Send } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  const [saved, setSaved] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);
  const likePost = useLikePost();

  const handleLike = useCallback(() => {
    if (liked) return;
    setLiked(true);
    likePost.mutate(
      { groupId: post.groupId, postId: post.postId },
      { onError: () => { setLiked(false); toast.error("Failed to like"); } }
    );
  }, [liked, likePost, post.groupId, post.postId]);

  // Double-tap to like (on media area)
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) handleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTapRef.current = now;
  }, [liked, handleLike]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/groups/${post.groupId}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Post by ${post.authorName}`, text: post.content.slice(0, 100), url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  }, [post]);

  // Expand long text
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 300;
  const displayContent = isLong && !expanded ? post.content.slice(0, 300) + "…" : post.content;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card overflow-hidden"
      role="article"
      aria-label={`Post by ${post.authorName}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link href={`/profile/${post.authorId}`}>
          <Avatar name={post.authorName} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.authorId}`} className="hover:underline">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{post.authorName}</p>
          </Link>
          <time className="text-xs text-gray-400" dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
        </div>
        <button className="btn-ghost p-1.5 rounded-lg" aria-label="More options">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Media — full width, double-tap to like */}
      {post.mediaUrl && (
        <div className="relative" onClick={handleDoubleTap}>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
            className="w-full cursor-zoom-in focus:outline-none"
            aria-label="View full screen"
          >
            <MediaImage src={post.mediaUrl} alt={`Media from ${post.authorName}`} className="rounded-none" />
          </button>
          {/* Double-tap heart animation */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="h-20 w-20 text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {post.mediaUrl && (
        <Lightbox src={post.mediaUrl} alt={`Media from ${post.authorName}`} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      )}

      {/* Actions row — Instagram style */}
      <div className="flex items-center px-4 pt-3 pb-1" role="group" aria-label="Post actions">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 1.3 }}
            onClick={handleLike}
            className="p-0.5"
            aria-label={liked ? "Unlike" : "Like"}
            aria-pressed={liked}
          >
            <Heart className={`h-6 w-6 transition-all duration-200 ${liked ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300 hover:text-gray-500"}`} />
          </motion.button>
          <button onClick={() => setShowComments((v) => !v)} className="p-0.5" aria-label="Comments" aria-expanded={showComments}>
            <MessageCircle className="h-6 w-6 text-gray-700 dark:text-gray-300 hover:text-gray-500 transition-colors" />
          </button>
          <button onClick={handleShare} className="p-0.5" aria-label="Share">
            <Send className="h-5 w-5 text-gray-700 dark:text-gray-300 hover:text-gray-500 transition-colors -rotate-45 -translate-y-0.5" />
          </button>
        </div>
        <button onClick={() => setSaved(!saved)} className="ml-auto p-0.5" aria-label={saved ? "Unsave" : "Save"}>
          <Bookmark className={`h-6 w-6 transition-all duration-200 ${saved ? "fill-gray-900 dark:fill-white text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300 hover:text-gray-500"}`} />
        </button>
      </div>

      {/* Like count */}
      <div className="px-4 pb-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatNumber(post.likeCount + (liked ? 1 : 0))} likes
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
          <Link href={`/profile/${post.authorId}`} className="font-semibold text-gray-900 dark:text-white hover:underline mr-1.5">
            {post.authorName}
          </Link>
          <span className="whitespace-pre-wrap">{displayContent}</span>
          {isLong && !expanded && (
            <button onClick={() => setExpanded(true)} className="text-gray-400 hover:text-gray-600 ml-1 text-sm">more</button>
          )}
        </p>
      </div>

      {/* Comment count link */}
      {post.commentCount > 0 && !showComments && (
        <button onClick={() => setShowComments(true)} className="px-4 pb-2 text-sm text-gray-400 hover:text-gray-600 transition-colors text-left">
          View all {formatNumber(post.commentCount)} comments
        </button>
      )}

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-4 pb-4 overflow-hidden">
            <CommentsPanel postId={post.postId} groupId={post.groupId} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
