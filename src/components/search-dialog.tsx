"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSearchGroups, useSearchUsers } from "@/hooks/use-search";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber } from "@/utils/format";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [tab, setTab] = useState<"groups" | "people">("groups");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);

  const { data: groups, isLoading: groupsLoading } = useSearchGroups(
    tab === "groups" ? debouncedQuery : ""
  );
  const { data: users, isLoading: usersLoading } = useSearchUsers(
    tab === "people" ? debouncedQuery : "",
    userId ?? ""
  );

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navigateTo = useCallback((path: string) => {
    router.push(path);
    onClose();
  }, [router, onClose]);

  const isLoading = tab === "groups" ? groupsLoading : usersLoading;
  const results = tab === "groups" ? groups : users;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg card shadow-2xl z-10 overflow-hidden"
            role="dialog"
            aria-label="Search"
            aria-modal="true"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search groups or people…"
                className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none text-sm"
                aria-label="Search query"
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800" role="tablist">
              {(["groups", "people"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  role="tab"
                  aria-selected={tab === t}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    tab === t
                      ? "text-brand-600 dark:text-brand-400 border-b-2 border-brand-500"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto" role="tabpanel">
              {!debouncedQuery.trim() ? (
                <div className="p-8 text-center">
                  <Search className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    Type to search {tab}
                  </p>
                </div>
              ) : isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !results?.length ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400">
                    No {tab} found for &ldquo;{debouncedQuery}&rdquo;
                  </p>
                </div>
              ) : tab === "groups" ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(groups ?? []).map((group) => (
                    <button
                      key={group.groupId}
                      onClick={() => navigateTo(`/groups/${group.groupId}`)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-surface-dark-3 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {group.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatNumber(group.memberCount)} members
                        </p>
                      </div>
                      <Badge variant={group.privacy === "PUBLIC" ? "default" : "brand"}>
                        {group.privacy}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(users ?? []).map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => navigateTo(`/profile/${user.userId}`)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-surface-dark-3 transition-colors text-left"
                    >
                      <Avatar name={user.name} src={user.profilePictureUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">{user.mobileNumber}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono text-[10px]">
                  Esc
                </kbd>{" "}
                to close
              </p>
              <p className="text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono text-[10px]">
                  ⌘K
                </kbd>{" "}
                to search
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
