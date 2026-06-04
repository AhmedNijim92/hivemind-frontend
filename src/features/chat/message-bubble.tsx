"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck, Trash2, SmilePlus } from "lucide-react";
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/format";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import type { ChatMessage } from "@/types/chat";

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

interface MessageBubbleProps {
  message: ChatMessage;
  isSent: boolean;
  showAvatar?: boolean;
  avatarSlot?: React.ReactNode;
}

export function MessageBubble({ message, isSent, showAvatar, avatarSlot }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const userId = useAuthStore((s) => s.userId);
  const reactToMessage = useChatStore((s) => s.reactToMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);

  const reactionEntries = Object.entries(message.reactions ?? {});
  const hasReactions = reactionEntries.length > 0;

  if (message.deleted === true) {
    return (
      <div className={cn("flex", isSent ? "justify-end" : "justify-start")}>
        <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 italic">Message deleted</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex gap-2 group", isSent ? "justify-end" : "justify-start")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {/* Avatar for received messages */}
      {!isSent && showAvatar && avatarSlot}
      {!isSent && !showAvatar && <div className="w-8 flex-shrink-0" />}

      <div className="relative max-w-[75%] sm:max-w-[65%]">
        {/* Action buttons (hover) */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "absolute -top-8 flex items-center gap-1 bg-white dark:bg-surface-dark-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-800 px-1 py-0.5 z-10",
                isSent ? "right-0" : "left-0"
              )}
            >
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="React"
              >
                <SmilePlus className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {isSent && (
                <button
                  onClick={() => deleteMessage(message.conversationId, message.id)}
                  className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label="Delete message"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              className={cn(
                "absolute -top-16 flex items-center gap-0.5 bg-white dark:bg-surface-dark-2 rounded-full shadow-xl border border-gray-100 dark:border-gray-800 px-2 py-1.5 z-20",
                isSent ? "right-0" : "left-0"
              )}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    if (userId) reactToMessage(message.conversationId, message.id, emoji, userId);
                    setShowReactions(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform p-0.5"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl relative",
            isSent
              ? "bg-brand-500 text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
          )}
        >
          {/* Image */}
          {message.imageUrl && (
            <div className="mb-2 -mx-1 -mt-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="rounded-xl max-h-48 object-cover w-full"
                loading="lazy"
              />
            </div>
          )}

          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Time + read receipt */}
          <div className={cn("flex items-center gap-1 mt-1", isSent ? "justify-end" : "")}>
            <span className={cn("text-[10px]", isSent ? "text-white/60" : "text-gray-400")}>
              {timeAgo(message.createdAt)}
            </span>
            {isSent && (
              message.read
                ? <CheckCheck className="h-3 w-3 text-white/80" />
                : <Check className="h-3 w-3 text-white/50" />
            )}
          </div>
        </div>

        {/* Reactions display */}
        {hasReactions && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isSent ? "justify-end" : "justify-start")}>
            {reactionEntries.map(([emoji, userIds]) => (
              <button
                key={emoji}
                onClick={() => { if (userId) reactToMessage(message.conversationId, message.id, emoji, userId); }}
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                  userIds.includes(userId ?? "")
                    ? "bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <span>{emoji}</span>
                {userIds.length > 1 && <span className="text-gray-500 text-[10px]">{userIds.length}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
