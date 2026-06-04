"use client";

import { useState, useMemo } from "react";
import { Search, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/auth-store";
import { useFollowers, useFollowing } from "@/hooks/use-user";
import { useStartConversation } from "@/hooks/use-chat";
import type { UserProfileDto } from "@/types";

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewChatModal({ open, onClose }: NewChatModalProps) {
  const [search, setSearch] = useState("");
  const userId = useAuthStore((s) => s.userId);
  const { data: followers } = useFollowers(userId ?? "");
  const { data: following } = useFollowing(userId ?? "");
  const startConversation = useStartConversation();

  // Merge followers + following, deduplicate by userId
  const users = useMemo(() => {
    const map = new Map<string, UserProfileDto>();
    for (const u of followers ?? []) {
      if (u.userId !== userId) map.set(u.userId, u);
    }
    for (const u of following ?? []) {
      if (u.userId !== userId) map.set(u.userId, u);
    }
    return Array.from(map.values());
  }, [followers, following, userId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleSelect = (user: UserProfileDto) => {
    startConversation(user.userId, user.name, user.profilePictureUrl);
    setSearch("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Message" size="sm">
      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search people…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-10 w-full"
          autoFocus
        />
      </div>

      {/* User list */}
      <div className="max-h-80 overflow-y-auto -mx-6 px-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No people found"
            description={
              users.length === 0
                ? "Follow people to start messaging them."
                : "Try a different search term."
            }
            className="border-0 shadow-none p-6"
          />
        ) : (
          <div className="space-y-1">
            {filtered.map((user) => (
              <button
                key={user.userId}
                onClick={() => handleSelect(user)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                  "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                )}
              >
                <Avatar
                  src={user.profilePictureUrl}
                  name={user.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.name}
                  </p>
                  {user.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
