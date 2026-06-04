"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Send, MessageCircle, Users, ImagePlus, X,
  Pin, BellOff, Bell, Trash2, MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageBubble } from "@/features/chat/message-bubble";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { useCurrentUser } from "@/hooks/use-user";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { mediaService } from "@/services/media.service";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatNumber } from "@/utils/format";
import toast from "react-hot-toast";

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();

  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === conversationId));
  const markConversationRead = useChatStore((s) => s.markConversationRead);
  const pinConversation = useChatStore((s) => s.pinConversation);
  const unpinConversation = useChatStore((s) => s.unpinConversation);
  const muteConversation = useChatStore((s) => s.muteConversation);
  const unmuteConversation = useChatStore((s) => s.unmuteConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const messages = useMessages(conversationId);
  const sendMessage = useSendMessage();

  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGroup = conversation?.type === "group";
  const otherUserId = !isGroup ? conversation?.participantIds.find((id) => id !== userId) : null;
  const displayName = isGroup ? conversation?.groupName ?? "Group Chat" : otherUserId ? conversation?.participantNames[otherUserId] ?? "Unknown" : "Unknown";
  const displayAvatar = !isGroup && otherUserId ? conversation?.participantAvatars[otherUserId] ?? null : null;
  const memberCount = isGroup ? conversation?.participantIds.length : undefined;

  usePageTitle(displayName);

  useEffect(() => {
    if (conversationId && userId) markConversationRead(conversationId, userId);
  }, [conversationId, userId, markConversationRead, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !imageFile) || !conversationId) return;
    const senderName = currentUser?.name ?? "You";

    let imageUrl: string | undefined;
    if (imageFile) {
      setUploading(true);
      try {
        const uploaded = await mediaService.upload(imageFile, undefined, "POST");
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        imageUrl = `${apiBase}/api/v1/media/${uploaded.mediaId}/download`;
      } catch {
        toast.error("Image upload failed");
      }
      setUploading(false);
    }

    sendMessage(conversationId, senderName, input.trim() || (imageUrl ? "📷 Photo" : ""), imageUrl);
    setInput("");
    removeImage();
    inputRef.current?.focus();
  }, [input, imageFile, conversationId, currentUser?.name, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDelete = () => {
    deleteConversation(conversationId);
    router.push("/chat");
    toast.success("Conversation deleted");
  };

  if (!conversation) {
    return <div className="max-w-2xl mx-auto px-4 py-6"><EmptyState icon={MessageCircle} title="Not found" actionLabel="Back" onAction={() => router.push("/chat")} /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen max-w-2xl mx-auto">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800"
      >
        <button onClick={() => router.push("/chat")} className="btn-ghost p-1.5 rounded-lg lg:hidden" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative flex-shrink-0">
          {isGroup ? (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          ) : (
            <>
              <Avatar src={displayAvatar} name={displayName} size="md" />
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-surface-dark" />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
          <p className="text-xs text-green-500">
            {isGroup ? `${formatNumber(memberCount ?? 0)} members` : "Online"}
          </p>
        </div>

        {/* Header actions */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="btn-ghost p-1.5 rounded-lg" aria-label="Menu">
            <MoreVertical className="h-5 w-5" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute right-0 top-full mt-1 w-48 card shadow-xl border border-gray-100 dark:border-gray-800 py-1 z-20"
              >
                <button onClick={() => { conversation.pinned ? unpinConversation(conversationId) : pinConversation(conversationId); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pin className="h-4 w-4" /> {conversation.pinned ? "Unpin" : "Pin conversation"}
                </button>
                <button onClick={() => { conversation.muted ? unmuteConversation(conversationId) : muteConversation(conversationId); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {conversation.muted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  {conversation.muted ? "Unmute" : "Mute"}
                </button>
                <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                <button onClick={() => { handleDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete conversation
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Click outside to close menu */}
      {showMenu && <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              {isGroup ? (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-white" />
                </div>
              ) : (
                <div className="mx-auto mb-3 flex justify-center"><Avatar src={displayAvatar} name={displayName} size="lg" /></div>
              )}
              <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-gray-500 mt-1">{isGroup ? "Send the first message to the group." : "Say hello! 👋"}</p>
            </div>
          </div>
        ) : (
          messages.map((message, i) => {
            const isSent = message.senderId === userId;
            const showSenderName = isGroup && !isSent && (i === 0 || messages[i - 1].senderId !== message.senderId);
            const showAvatar = !isSent && (i === messages.length - 1 || messages[i + 1]?.senderId !== message.senderId);

            // Date separator
            const showDate = i === 0 || new Date(message.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                      {new Date(message.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
                {showSenderName && <p className="text-xs text-gray-400 ml-10 mb-0.5 font-medium">{message.senderName}</p>}
                <MessageBubble
                  message={message}
                  isSent={isSent}
                  showAvatar={showAvatar}
                  avatarSlot={showAvatar ? <Avatar name={message.senderName} size="xs" className="mt-auto flex-shrink-0" /> : undefined}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark"
          >
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl" />
              <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5" aria-label="Remove">
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="sticky bottom-0 px-4 py-3 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 safe-area-pb">
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost p-2 rounded-xl flex-shrink-0" aria-label="Attach image">
            <ImagePlus className="h-5 w-5 text-gray-400" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

          <input
            ref={inputRef}
            type="text"
            placeholder={isGroup ? "Message the group…" : "Type a message…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-base flex-1 py-2.5"
            autoFocus
            aria-label="Message"
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={(!input.trim() && !imageFile) || uploading}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200 flex-shrink-0",
              (input.trim() || imageFile)
                ? "bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/25"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            )}
            aria-label="Send"
          >
            {uploading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
