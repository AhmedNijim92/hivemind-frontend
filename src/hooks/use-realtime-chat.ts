import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService, ChatMessageDto } from "@/services/chat.service";
import { useAuthStore } from "@/store/auth-store";

/**
 * Hook for real-time chat in a conversation.
 * Messages are stored on the server (Redis via REST API).
 * Polls every 2 seconds for new messages.
 *
 * Usage:
 *   const { messages, sendMessage, isLoading } = useRealtimeChat("conversation-id");
 */
export function useRealtimeChat(conversationId: string) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat", "messages", conversationId],
    queryFn: () => chatService.getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 2000, // Poll every 2 seconds
    staleTime: 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ content, imageUrl }: { content: string; imageUrl?: string }) =>
      chatService.sendMessage(conversationId, content, imageUrl),
    onSuccess: () => {
      // Immediately refetch messages
      qc.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
    },
  });

  const sendMessage = (content: string, imageUrl?: string) => {
    if (!content.trim() && !imageUrl) return;
    mutation.mutate({ content, imageUrl });
  };

  return {
    messages: messages ?? [],
    sendMessage,
    isLoading,
    isSending: mutation.isPending,
    userId,
  };
}
