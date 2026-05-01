"use client";

import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/search-dialog";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { CreatePostModal } from "@/features/posts/create-post-modal";
import { CreateGroupModal } from "@/features/groups/create-group-modal";
import { useUIStore } from "@/store/ui-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isSearchOpen, openSearch, closeSearch } = useUIStore();

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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <MobileNav />
      <CreatePostModal />
      <CreateGroupModal />
      <SearchDialog open={isSearchOpen} onClose={closeSearch} />
      <ScrollToTop />
    </AuthGuard>
  );
}
