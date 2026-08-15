export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  read: boolean;
  reactions: Record<string, string[]>; // emoji -> userIds
  deleted: boolean;
}

export type ConversationType = "dm" | "group";

export interface Conversation {
  id: string;
  type: ConversationType;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string | null>;
  groupId?: string;
  groupName?: string;
  groupAvatar?: string | null;
  lastMessage: ChatMessage | null;
  updatedAt: string;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
}
