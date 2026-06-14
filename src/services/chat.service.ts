import { apiClient } from "./api-client";

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  imageUrl: string | null;
  timestamp: string;
}

export const chatService = {
  /**
   * Send a message to a conversation (group chat, DM, or meeting room).
   */
  sendMessage: async (conversationId: string, content: string, imageUrl?: string): Promise<ChatMessageDto> => {
    const res = await apiClient.post<ChatMessageDto>(`/api/v1/chat/${conversationId}`, {
      content,
      imageUrl: imageUrl ?? null,
    });
    return res.data;
  },

  /**
   * Get messages for a conversation. Pass 'after' index to get only new messages (polling).
   */
  getMessages: async (conversationId: string, after = 0): Promise<ChatMessageDto[]> => {
    const res = await apiClient.get<string[]>(`/api/v1/chat/${conversationId}?after=${after}`);
    // Backend returns JSON strings, parse them
    return res.data.map((s) => {
      try { return JSON.parse(s); }
      catch { return null; }
    }).filter(Boolean) as ChatMessageDto[];
  },

  /**
   * Get total message count (for detecting new messages).
   */
  getMessageCount: async (conversationId: string): Promise<number> => {
    const res = await apiClient.get<number>(`/api/v1/chat/${conversationId}/count`);
    return res.data;
  },
};
