import { useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { chatService, ChatMessageDto } from "@/services/chat.service";
import type { Conversation, ChatMessage } from "@/types/chat";

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

/** Returns messages for a specific conversation — polls server every 2s */
export function useMessages(conversationId: string) {
  const userId = useAuthStore((s) => s.userId);
  const localMessages = useChatStore((s) => s.messages[conversationId] ?? []);

  // Poll server for messages
  const { data: serverMessages } = useQuery({
    queryKey: ["chat", "messages", conversationId],
    queryFn: () => chatService.getMessages(conversationId),
    enabled: !!conversationId && !!userId,
    refetchInterval: 2000,
    staleTime: 1000,
  });

  // Merge: prefer server messages if available, fall back to local
  return useMemo(() => {
    if (serverMessages && serverMessages.length > 0) {
      // Convert server format to local ChatMessage format
      return serverMessages.map((m): ChatMessage => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.senderName,
        content: m.content,
        imageUrl: m.imageUrl,
        createdAt: m.timestamp,
        read: true,
        reactions: {},
        deleted: false,
      }));
    }
    return localMessages;
  }, [serverMessages, localMessages]);
}

/** Returns a function to send a message — saves to server + local store */
export function useSendMessage() {
  const sendLocalMessage = useChatStore((s) => s.sendMessage);
  const userId = useAuthStore((s) => s.userId);
  const qc = useQueryClient();

  return useCallback(
    (conversationId: string, senderName: string, content: string, imageUrl?: string) => {
      if (!userId) {
        toast.error("You must be logged in to send messages");
        return null;
      }
      if (!content.trim() && !imageUrl) return null;

      // Save locally for instant display
      const msg = sendLocalMessage(conversationId, userId, senderName, content.trim(), imageUrl);

      // Send to server for other users to see
      chatService.sendMessage(conversationId, content.trim(), imageUrl)
        .then(() => {
          // Refresh messages from server
          qc.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
        })
        .catch(() => {
          // Message still saved locally even if server fails
        });

      return msg;
    },
    [sendLocalMessage, userId, qc]
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
