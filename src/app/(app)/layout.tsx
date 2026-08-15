"use client";

import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { GroupContextGuard } from "@/components/group-context-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/search-dialog";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { CreatePostModal } from "@/features/posts/create-post-modal";
import { CreateGroupModal } from "@/features/groups/create-group-modal";
import { AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/ui-store";
import { useTokenExpiry } from "@/hooks/use-token-expiry";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isSearchOpen, openSearch, closeSearch } = useUIStore();
  useTokenExpiry();

  // Global keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openSearch]);

  return (
    <AuthGuard>
      <GroupContextGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                {children}
              </AnimatePresence>
            </ErrorBoundary>
          </main>
        </div>
        <MobileNav />
        <CreatePostModal />
        <CreateGroupModal />
        <SearchDialog open={isSearchOpen} onClose={closeSearch} />
        <ScrollToTop />
        <ScrollProgress />
      </GroupContextGuard>
    </AuthGuard>
  );
}
