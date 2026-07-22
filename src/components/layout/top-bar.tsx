"use client";

import Link from "next/link";
import { Menu, Search, Bell } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useUnreadCount } from "@/hooks/use-notifications";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openSearch = useUIStore((s) => s.openSearch);
  const { data: currentUser } = useCurrentUser();
  const { data: unreadCount } = useUnreadCount();
  const userId = useAuthStore((s) => s.userId);

  return (
    <header className="sticky top-0 z-20 lg:hidden bg-white/90 dark:bg-[#0f0f13]/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.04] px-4 h-14 flex items-center gap-3">
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Logo on mobile */}
      <Link href="/feed" className="flex items-center gap-1.5">
        <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center">
          <span className="text-white font-bold text-xs">H</span>
        </div>
        {!title && (
          <span className="font-bold text-[15px] text-gray-900 dark:text-white">
            Hive<span className="text-brand-500">Mind</span>
          </span>
        )}
        {title && <span className="font-semibold text-[15px] text-gray-900 dark:text-white">{title}</span>}
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={openSearch}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
          aria-label="Search"
        >
          <Search className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400" />
        </button>

        <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
          <Bell className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0f0f13]" />
          )}
        </Link>

        <Link href={`/profile/${userId}`} className="ml-1">
          <Avatar name={currentUser?.name} size="xs" src={currentUser?.profilePictureUrl} />
        </Link>
      </div>
    </header>
  );
}
