/**
 * Chat store — persisted to localStorage.
 * Supports DMs, group chats, reactions, pinning, muting, deletion.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatMessage, Conversation } from "@/types/chat";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function makeDmId(a: string, b: string): string {
  return [a, b].sort().join("_");
}
function makeGroupChatId(groupId: string): string {
  return `group_${groupId}`;
}

interface ChatStore {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;

  getOrCreateDm: (currentUserId: string, targetUserId: string, targetName: string, targetAvatar: string | null) => Conversation;
  getOrCreateGroupChat: (groupId: string, groupName: string, memberIds: string[], memberNames: Record<string, string>, memberAvatars: Record<string, string | null>) => Conversation;
  sendMessage: (conversationId: string, senderId: string, senderName: string, content: string, imageUrl?: string) => ChatMessage;
  deleteMessage: (conversationId: string, messageId: string) => void;
  reactToMessage: (conversationId: string, messageId: string, emoji: string, userId: string) => void;
  markConversationRead: (conversationId: string, userId: string) => void;
  pinConversation: (conversationId: string) => void;
  unpinConversation: (conversationId: string) => void;
  muteConversation: (conversationId: string) => void;
  unmuteConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  getConversations: (userId: string) => Conversation[];
  getTotalUnread: (userId: string) => number;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},

      getOrCreateDm: (currentUserId, targetUserId, targetName, targetAvatar) => {
        const state = get();
        const convId = makeDmId(currentUserId, targetUserId);
        const existing = state.conversations.find((c) => c.id === convId);
        if (existing) return existing;

        const conversation: Conversation = {
          id: convId, type: "dm",
          participantIds: [currentUserId, targetUserId],
          participantNames: { [currentUserId]: "You", [targetUserId]: targetName },
          participantAvatars: { [currentUserId]: null, [targetUserId]: targetAvatar },
          lastMessage: null, updatedAt: new Date().toISOString(), unreadCount: 0,
          pinned: false, muted: false,
        };
        set((s) => ({ conversations: [conversation, ...s.conversations], messages: { ...s.messages, [convId]: [] } }));
        return conversation;
      },

      getOrCreateGroupChat: (groupId, groupName, memberIds, memberNames, memberAvatars) => {
        const state = get();
        const convId = makeGroupChatId(groupId);
        const existing = state.conversations.find((c) => c.id === convId);
        if (existing) {
          set((s) => ({ conversations: s.conversations.map((c) => c.id === convId ? { ...c, participantIds: memberIds, participantNames: memberNames, participantAvatars: memberAvatars, groupName } : c) }));
          return { ...existing, participantIds: memberIds, participantNames: memberNames, participantAvatars: memberAvatars, groupName };
        }
        const conversation: Conversation = {
          id: convId, type: "group", groupId, groupName,
          participantIds: memberIds, participantNames: memberNames, participantAvatars: memberAvatars,
          lastMessage: null, updatedAt: new Date().toISOString(), unreadCount: 0,
          pinned: false, muted: false,
        };
        set((s) => ({ conversations: [conversation, ...s.conversations], messages: { ...s.messages, [convId]: [] } }));
        return conversation;
      },

      sendMessage: (conversationId, senderId, senderName, content, imageUrl) => {
        const message: ChatMessage = {
          id: generateId(), conversationId, senderId, senderName,
          content, imageUrl: imageUrl ?? null,
          createdAt: new Date().toISOString(), read: false,
          reactions: {}, deleted: false,
        };
        set((s) => {
          const convMessages = [...(s.messages[conversationId] ?? []), message];
          const conversations = s.conversations.map((c) =>
            c.id === conversationId ? { ...c, lastMessage: message, updatedAt: message.createdAt, unreadCount: c.unreadCount + 1 } : c
          );
          return { messages: { ...s.messages, [conversationId]: convMessages }, conversations };
        });
        return message;
      },

      deleteMessage: (conversationId, messageId) => {
        set((s) => ({
          messages: {
            ...s.messages,
            [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
              m.id === messageId ? { ...m, deleted: true, content: "This message was deleted" } : m
            ),
          },
        }));
      },

      reactToMessage: (conversationId, messageId, emoji, userId) => {
        set((s) => ({
          messages: {
            ...s.messages,
            [conversationId]: (s.messages[conversationId] ?? []).map((m) => {
              if (m.id !== messageId) return m;
              const reactions = { ...m.reactions };
              const users = reactions[emoji] ?? [];
              if (users.includes(userId)) {
                reactions[emoji] = users.filter((id) => id !== userId);
                if (reactions[emoji].length === 0) delete reactions[emoji];
              } else {
                reactions[emoji] = [...users, userId];
              }
              return { ...m, reactions };
            }),
          },
        }));
      },

      markConversationRead: (conversationId, _userId) => {
        set((s) => ({
          messages: { ...s.messages, [conversationId]: (s.messages[conversationId] ?? []).map((m) => ({ ...m, read: true })) },
          conversations: s.conversations.map((c) => c.id === conversationId ? { ...c, unreadCount: 0 } : c),
        }));
      },

      pinConversation: (conversationId) => {
        set((s) => ({ conversations: s.conversations.map((c) => c.id === conversationId ? { ...c, pinned: true } : c) }));
      },
      unpinConversation: (conversationId) => {
        set((s) => ({ conversations: s.conversations.map((c) => c.id === conversationId ? { ...c, pinned: false } : c) }));
      },
      muteConversation: (conversationId) => {
        set((s) => ({ conversations: s.conversations.map((c) => c.id === conversationId ? { ...c, muted: true } : c) }));
      },
      unmuteConversation: (conversationId) => {
        set((s) => ({ conversations: s.conversations.map((c) => c.id === conversationId ? { ...c, muted: false } : c) }));
      },
      deleteConversation: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== conversationId),
          messages: Object.fromEntries(Object.entries(s.messages).filter(([k]) => k !== conversationId)),
        }));
      },

      getConversations: (userId) => {
        return get().conversations
          .filter((c) => c.participantIds.includes(userId))
          .sort((a, b) => {
            // Pinned first, then by updatedAt
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
      },

      getTotalUnread: (userId) => {
        return get().conversations
          .filter((c) => c.participantIds.includes(userId) && !c.muted)
          .reduce((sum, c) => sum + c.unreadCount, 0);
      },
    }),
    {
      name: "hivemind-chat",
      storage: createJSONStorage(() => typeof window !== "undefined" ? localStorage : sessionStorage),
    }
  )
);
