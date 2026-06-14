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
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="card overflow-hidden group/card"
      role="article"
      aria-label={`Post by ${post.authorName !== "Unknown" ? post.authorName : "a member"}${post.groupName ? ` in ${post.groupName}` : ""}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-2">
        <Link href={`/profile/${post.authorId}`}>
          <Avatar name={post.authorName !== "Unknown" ? post.authorName : undefined} src={post.authorProfilePictureUrl} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          {/* Group name — primary context */}
          {post.groupName && (
            <Link href={`/groups/${post.groupId}`} className="hover:underline">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">{post.groupName}</p>
            </Link>
          )}
          {/* Author name + time */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Link href={`/profile/${post.authorId}`} className="hover:underline">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {post.authorName !== "Unknown" ? post.authorName : "Member"}
              </span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
            <time className="text-xs text-gray-400" dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors opacity-0 group-hover/card:opacity-100"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </motion.button>
      </div>

      {/* Media — full width, double-tap to like */}
      {post.mediaUrl && (
        <div className="relative mt-2" onClick={handleDoubleTap}>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
            className="w-full cursor-zoom-in focus:outline-none"
            aria-label="View full screen"
          >
            <MediaImage src={post.mediaUrl} alt={`Media from ${post.authorName}`} className="rounded-none" />
          </button>
          {/* Double-tap heart animation with particles */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="h-24 w-24 text-white fill-white drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {post.mediaUrl && (
        <Lightbox src={post.mediaUrl} alt={`Media from ${post.authorName}`} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      )}

      {/* Actions row */}
      <div className="flex items-center px-5 pt-3 pb-1" role="group" aria-label="Post actions">
        <div className="flex items-center gap-1">
          {/* Like button with heart burst */}
          <motion.button
            whileTap={{ scale: 1.4 }}
            animate={liked ? { scale: [1, 1.3, 0.9, 1] } : {}}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={handleLike}
            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            aria-label={liked ? "Unlike" : "Like"}
            aria-pressed={liked}
          >
            <Heart className={`h-6 w-6 transition-all duration-300 ${liked ? "fill-red-500 text-red-500 drop-shadow-sm" : "text-gray-600 dark:text-gray-400"}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowComments((v) => !v)}
            className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
            aria-label="Comments"
            aria-expanded={showComments}
          >
            <MessageCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="p-2 rounded-xl hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
            aria-label="Share"
          >
            <Send className="h-5 w-5 text-gray-600 dark:text-gray-400 -rotate-45 -translate-y-0.5" />
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSaved(!saved)}
          className="ml-auto p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Bookmark className={`h-6 w-6 transition-all duration-300 ${saved ? "fill-gray-900 dark:fill-white text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`} />
        </motion.button>
      </div>

      {/* Like count */}
      <div className="px-5 pb-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatNumber(post.likeCount + (liked ? 1 : 0))} likes
        </p>
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
          <Link href={`/profile/${post.authorId}`} className="font-semibold text-gray-900 dark:text-white hover:underline mr-1.5">
            {post.authorName !== "Unknown" ? post.authorName : (post.groupName ?? "Member")}
          </Link>
          <span className="whitespace-pre-wrap">{displayContent}</span>
          {isLong && !expanded && (
            <button onClick={() => setExpanded(true)} className="text-gray-400 hover:text-gray-600 ml-1 text-sm">more</button>
          )}
        </p>
      </div>

      {/* Comment count link */}
      {post.commentCount > 0 && !showComments && (
        <button onClick={() => setShowComments(true)} className="px-5 pb-3 text-sm text-gray-400 hover:text-gray-600 transition-colors text-left">
          View all {formatNumber(post.commentCount)} comments
        </button>
      )}

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="px-5 pb-5 overflow-hidden"
          >
            <CommentsPanel postId={post.postId} groupId={post.groupId} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
