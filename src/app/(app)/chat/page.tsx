"use client";

import { useState, useMemo } from "react";
import { MessageCircle, Plus, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConversationItem } from "@/features/chat/conversation-item";
import { NewChatModal } from "@/features/chat/new-chat-modal";
import { useConversations } from "@/hooks/use-chat";
import { usePageTitle } from "@/hooks/use-page-title";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuthStore } from "@/store/auth-store";

export default function ChatPage() {
  usePageTitle("Messages");
  const conversations = useConversations();
  const userId = useAuthStore((s) => s.userId);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return conversations;
    const q = debouncedSearch.toLowerCase();
    return conversations.filter((c) => {
      if (c.type === "group") return c.groupName?.toLowerCase().includes(q);
      const otherUserId = c.participantIds.find((id) => id !== userId);
      const otherName = otherUserId ? c.participantNames[otherUserId] : "";
      return otherName?.toLowerCase().includes(q);
    });
  }, [conversations, debouncedSearch, userId]);

  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  return (
    <>
      <TopBar title="Messages" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden lg:block">Messages</h1>
          <Button size="sm" onClick={() => setIsNewChatOpen(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>

        {/* Search */}
        {conversations.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-10 pr-10 py-2.5 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Conversations */}
        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="Start a conversation with a friend or group."
            actionLabel="New message"
            onAction={() => setIsNewChatOpen(true)}
          />
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No conversations match &ldquo;{debouncedSearch}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Pinned</p>
                <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                  <AnimatePresence>
                    {pinned.map((c) => <ConversationItem key={c.id} conversation={c} />)}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* All messages */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">All Messages</p>
                )}
                <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                  <AnimatePresence>
                    {unpinned.map((c) => <ConversationItem key={c.id} conversation={c} />)}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <NewChatModal open={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
    </>
  );
}
