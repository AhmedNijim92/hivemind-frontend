import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation } from "@/types/chat";

/** Returns sorted conversations for the current user */
export function useConversations() {
  const userId = useAuthStore((s) => s.userId);
  const conversations = useChatStore((s) => s.conversations);
  const getConversations = useChatStore((s) => s.getConversations);

  return useMemo(() => {
    if (!userId) return [];
    return getConversations(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, conversations]);
}

/** Returns messages for a specific conversation */
export function useMessages(conversationId: string) {
  const allMessages = useChatStore((s) => s.messages);
  return useMemo(
    () => allMessages[conversationId] ?? [],
    [allMessages, conversationId]
  );
}

/** Returns a function to send a message */
export function useSendMessage() {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const userId = useAuthStore((s) => s.userId);

  return useCallback(
    (conversationId: string, senderName: string, content: string, imageUrl?: string) => {
      if (!userId) {
        toast.error("You must be logged in to send messages");
        return null;
      }
      if (!content.trim() && !imageUrl) return null;
      return sendMessage(conversationId, userId, senderName, content.trim(), imageUrl);
    },
    [sendMessage, userId]
  );
}

/** Returns a function to start or open a DM conversation with a user */
export function useStartConversation() {
  const getOrCreateDm = useChatStore((s) => s.getOrCreateDm);
  const userId = useAuthStore((s) => s.userId);
  const router = useRouter();

  return useCallback(
    (
      targetUserId: string,
      targetName: string,
      targetAvatar: string | null
    ): Conversation | null => {
      if (!userId) {
        toast.error("You must be logged in to start a conversation");
        return null;
      }
      const conversation = getOrCreateDm(userId, targetUserId, targetName, targetAvatar);
      router.push(`/chat/${conversation.id}`);
      return conversation;
    },
    [getOrCreateDm, userId, router]
  );
}

/** Returns a function to open a group chat */
export function useOpenGroupChat() {
  const getOrCreateGroupChat = useChatStore((s) => s.getOrCreateGroupChat);
  const router = useRouter();

  return useCallback(
    (
      groupId: string,
      groupName: string,
      memberIds: string[],
      memberNames: Record<string, string>,
      memberAvatars: Record<string, string | null>
    ) => {
      const conversation = getOrCreateGroupChat(
        groupId,
        groupName,
        memberIds,
        memberNames,
        memberAvatars
      );
      router.push(`/chat/${conversation.id}`);
      return conversation;
    },
    [getOrCreateGroupChat, router]
  );
}

/** Returns total unread message count across all conversations */
export function useTotalUnread(): number {
  const userId = useAuthStore((s) => s.userId);
  const conversations = useChatStore((s) => s.conversations);
  const getTotalUnread = useChatStore((s) => s.getTotalUnread);

  return useMemo(() => {
    if (!userId) return 0;
    return getTotalUnread(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, conversations]);
}
