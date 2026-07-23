"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Heart, Send, Eye } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useViewStory } from "@/hooks/use-stories";
import { useAuthStore } from "@/store/auth-store";
import { timeAgo } from "@/utils/format";
import type { StoryGroup } from "@/types/story";
import toast from "react-hot-toast";

const STORY_DURATION = 5000;

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

export function StoryViewer({ groups, initialGroupIndex, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const [liked, setLiked] = useState(false);
  const [reply, setReply] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);

  const userId = useAuthStore((s) => s.userId);
  const markViewed = useViewStory();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isOwnStory = currentGroup?.stories.some(s => s.userId === userId);
  const viewCount = currentStory?.viewedBy?.length ?? 0;

  useEffect(() => { if (currentStory) markViewed(currentStory.id); }, [currentStory, markViewed]);
  useEffect(() => { setLiked(false); }, [groupIndex, storyIndex]);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const goNext = useCallback(() => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) { setStoryIndex((i) => i + 1); setProgress(0); }
    else if (groupIndex < groups.length - 1) { setDirection(1); setGroupIndex((i) => i + 1); setStoryIndex(0); setProgress(0); }
    else onClose();
  }, [currentGroup, storyIndex, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) { setStoryIndex((i) => i - 1); setProgress(0); }
    else if (groupIndex > 0) { setDirection(-1); const pg = groups[groupIndex - 1]; setGroupIndex((i) => i - 1); setStoryIndex(pg.stories.length - 1); setProgress(0); }
  }, [storyIndex, groupIndex, groups]);

  useEffect(() => {
    if (paused || showReplyInput) return;
    const interval = 50;
    const step = (interval / STORY_DURATION) * 100;
    timerRef.current = setInterval(() => {
      setProgress((prev) => { if (prev >= 100) { goNext(); return 0; } return prev + step; });
    }, interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, showReplyInput, goNext, storyIndex, groupIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showReplyInput) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev, showReplyInput]);

  const handleTap = (e: React.MouseEvent) => {
    if (showReplyInput) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) goPrev(); else goNext();
  };

  const handleLike = () => {
    setLiked(true);
    toast.success("❤️");
  };

  const handleSendReply = () => {
    if (!reply.trim()) return;
    toast.success(`Reply sent to ${currentGroup?.groupName}`);
    setReply("");
    setShowReplyInput(false);
  };

  if (!currentGroup || !currentStory) { onClose(); return null; }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 z-20 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Close">
        <X className="h-6 w-6" />
      </button>

      {groupIndex > 0 && (
        <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block" aria-label="Previous">
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {groupIndex < groups.length - 1 && (
        <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors hidden sm:block" aria-label="Next">
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`${groupIndex}-${storyIndex}`}
          custom={direction}
          initial={{ opacity: 0, x: direction * 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -100 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          ref={containerRef}
          onClick={handleTap}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          className="relative w-full max-w-md h-full max-h-[90vh] sm:max-h-[85vh] sm:rounded-2xl overflow-hidden select-none cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentStory.mediaUrl} alt={currentStory.caption ?? "Story"} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-3">
            {currentGroup.stories.map((s, i) => (
              <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
                <motion.div className="h-full bg-white rounded-full" style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${Math.min(progress, 100)}%` : "0%" }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-7 left-0 right-0 z-10 flex items-center gap-3 px-4">
            <Avatar name={currentGroup.groupName} size="sm" src={currentGroup.groupAvatar} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentGroup.groupName}</p>
              <p className="text-[11px] text-white/60">{timeAgo(currentStory.createdAt)}</p>
            </div>
            {/* View count for own stories */}
            {isOwnStory && viewCount > 0 && (
              <div className="flex items-center gap-1 text-white/70">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">{viewCount}</span>
              </div>
            )}
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-16 left-0 right-0 z-10 px-4">
              <p className="text-white text-sm font-medium text-center drop-shadow-lg bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2 mx-auto max-w-xs">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Bottom actions */}
          {!isOwnStory && (
            <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4">
              {showReplyInput ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendReply(); if (e.key === "Escape") setShowReplyInput(false); }}
                    placeholder={`Reply to ${currentGroup.groupName}…`}
                    className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder:text-white/50 rounded-full px-4 py-2.5 text-sm outline-none border border-white/20 focus:border-white/40"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button onClick={(e) => { e.stopPropagation(); handleSendReply(); }} className="p-2 rounded-full bg-brand-500 text-white">
                    <Send className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowReplyInput(true); setTimeout(() => replyInputRef.current?.focus(), 100); }}
                    className="flex-1 bg-white/10 backdrop-blur-md text-white/60 rounded-full px-4 py-2.5 text-sm text-left border border-white/20 hover:border-white/40 transition-colors"
                  >
                    Send a reply…
                  </button>
                  <motion.button
                    whileTap={{ scale: 1.3 }}
                    onClick={(e) => { e.stopPropagation(); handleLike(); }}
                    className="p-2"
                  >
                    <Heart className={`h-7 w-7 transition-all ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
