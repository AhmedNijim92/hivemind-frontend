"use client";

import Link from "next/link";
import { Users, Pin, BellOff, Check, CheckCheck, Clock, Image } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/utils/format";
import { useAuthStore } from "@/store/auth-store";
import { useHaptic } from "@/hooks/use-haptic";
import type { Conversation } from "@/types/chat";

interface ConversationItemProps {
  conversation: Conversation;
}

/**
 * Delivery status icon with color coding:
 * - Clock (pending/sending)
 * - Single check (sent/delivered)
 * - Double check gray (delivered)
 * - Double check blue (read)
 */
function DeliveryStatus({ read, deleted }: { read: boolean; deleted: boolean }) {
  if (deleted) return null;
  if (read) return <CheckCheck className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />;
  return <Check className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const userId = useAuthStore((s) => s.userId);
  const haptic = useHaptic();
  const hasUnread = conversation.unreadCount > 0 && !conversation.muted;
  const isGroup = conversation.type === "group";

  const otherUserId = !isGroup ? conversation.participantIds.find((id) => id !== userId) : null;
  const displayName = isGroup
    ? conversation.groupName ?? "Group Chat"
    : otherUserId ? conversation.participantNames[otherUserId] ?? "Unknown" : "Unknown";
  const displayAvatar = isGroup ? null : otherUserId ? conversation.participantAvatars[otherUserId] ?? null : null;

  const lastMsg = conversation.lastMessage;
  const lastMessageDeleted = lastMsg?.deleted === true;
  const lastMessageHasImage = !!lastMsg?.imageUrl;
  const lastMessagePreview = lastMsg
    ? lastMessageDeleted
      ? "Message deleted"
      : lastMsg.content.length > 45
        ? lastMsg.content.slice(0, 45) + "…"
        : lastMsg.content
    : "No messages yet";

  const lastMessageTime = lastMsg ? timeAgo(lastMsg.createdAt) : "";

  const senderPrefix = lastMsg?.senderId === userId
    ? "You: "
    : isGroup && lastMsg && !lastMessageDeleted
      ? `${lastMsg.senderName.split(" ")[0]}: `
      : "";

  const isSentByMe = lastMsg?.senderId === userId;

  // Simulated last-seen timestamp for DMs
  const lastSeenText = !isGroup ? "Last seen recently" : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Link
        href={`/chat/${conversation.id}`}
        onClick={() => haptic.tap()}
        className={cn(
          "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors relative",
          hasUnread && "bg-brand-50/30 dark:bg-brand-950/10"
        )}
      >
        {/* Pin indicator */}
        {conversation.pinned && (
          <Pin className="absolute top-2 right-2 h-3 w-3 text-gray-300 dark:text-gray-600 rotate-45" />
        )}

        {/* Avatar with online dot */}
        <div className="relative flex-shrink-0">
          {isGroup ? (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          ) : (
            <Avatar src={displayAvatar} name={displayName} size="md" className="h-12 w-12" />
          )}
          {/* Online indicator for DMs */}
          {!isGroup && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-surface-dark" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: name + time */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className={cn(
                "text-sm truncate",
                hasUnread ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-900 dark:text-gray-100"
              )}>
                {displayName}
              </p>
              {conversation.muted && <BellOff className="h-3 w-3 text-gray-400 flex-shrink-0" />}
              {isGroup && (
                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {conversation.participantIds.length}
                </span>
              )}
            </div>
            <span className={cn(
              "text-xs flex-shrink-0",
              hasUnread ? "text-brand-500 font-semibold" : "text-gray-400"
            )}>
              {lastMessageTime}
            </span>
          </div>

          {/* Bottom row: preview + badge */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <div className={cn(
              "flex items-center gap-1 text-xs truncate",
              hasUnread ? "font-semibold text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"
            )}>
              {/* Delivery status for sent messages */}
              {isSentByMe && lastMsg && !lastMessageDeleted && (
                <DeliveryStatus read={lastMsg.read} deleted={lastMsg.deleted} />
              )}
              {senderPrefix && <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{senderPrefix}</span>}
              {lastMessageHasImage && !lastMessageDeleted && <Image className="h-3 w-3 flex-shrink-0" />}
              <span className={cn("truncate", lastMessageDeleted && "italic text-gray-400")}>{lastMessagePreview}</span>
            </div>
            {hasUnread && (
              <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </span>
            )}
          </div>

          {/* Last seen timestamp for DMs */}
          {lastSeenText && !hasUnread && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5 text-gray-300 dark:text-gray-600" />
              <span className="text-[10px] text-gray-300 dark:text-gray-600">{lastSeenText}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
