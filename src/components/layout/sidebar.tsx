"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, Bell, User, Video, Plus, LogOut,
  Sun, Moon, X, Search, Settings, MessageCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { ActiveGroupBanner } from "@/components/active-group-banner";
import { useCurrentUser } from "@/hooks/use-user";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useTotalUnread } from "@/hooks/use-chat";
import { useUIStore } from "@/store/ui-store";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/meetings", icon: Video, label: "Meetings" },
  { href: "/chat", icon: MessageCircle, label: "Messages", badge: true },
  { href: "/notifications", icon: Bell, label: "Notifications", badge: true },
  { href: "/profile", icon: User, label: "Profile" },
];

function NavItem({ href, icon: Icon, label, badge, unreadCount, onClick }: {
  href: string; icon: React.ElementType; label: string; badge?: boolean; unreadCount?: number; onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group/nav",
        isActive
          ? "text-brand-600 dark:text-brand-400 font-medium"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      )}
    >
      {isActive && (
        <motion.div layoutId="sidebar-pill"
          className="absolute inset-0 bg-brand-50 dark:bg-brand-950/20 rounded-xl"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      {!isActive && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover/nav:opacity-100 bg-gray-50 dark:bg-white/[0.02] transition-opacity" />
      )}

      <div className="relative z-10">
        <Icon className="h-[18px] w-[18px]" />
        {badge && unreadCount && unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 9 ? "•" : unreadCount}
          </span>
        ) : null}
      </div>
      <span className="text-[13px] relative z-10">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const { data: currentUser } = useCurrentUser();
  const { data: unreadCount } = useUnreadCount();
  const chatUnread = useTotalUnread();
  const { openCreatePost, openCreateGroup, isSidebarOpen, closeSidebar } = useUIStore();
  const openSearch = useUIStore((s) => s.openSearch);
  const { resolvedTheme, setTheme } = useTheme();
  const logout = useLogout();
  const userId = useAuthStore((s) => s.userId);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Link href="/feed" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">H</span>
          </div>
          <span className="font-bold text-[15px] text-gray-900 dark:text-white">
            Hive<span className="text-brand-500">Mind</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item}
            unreadCount={item.href === "/chat" ? chatUnread : item.href === "/notifications" ? (unreadCount ?? 0) : 0}
            onClick={closeSidebar}
          />
        ))}

        {/* Search */}
        <button onClick={() => { openSearch(); closeSidebar(); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] hover:text-gray-900 dark:hover:text-gray-100 transition-all"
        >
          <Search className="h-[18px] w-[18px]" />
          <span className="text-[13px]">Search</span>
          <kbd className="ml-auto text-[9px] text-gray-400 bg-gray-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      </nav>

      {/* Actions */}
      <div className="px-3 pt-3 pb-2 space-y-1.5">
        <button onClick={() => { openCreatePost(); closeSidebar(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Post
        </button>
        <button onClick={() => { openCreateGroup(); closeSidebar(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
        >
          <Users className="h-4 w-4" /> New Group
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-white/[0.04] space-y-0.5">
        <ActiveGroupBanner className="mb-1.5" />

        {/* Theme */}
        <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Settings */}
        <Link href="/settings" onClick={closeSidebar}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>

        {/* User profile */}
        <Link href={`/profile/${userId}`} onClick={closeSidebar}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
        >
          <Avatar name={currentUser?.name} size="sm" src={currentUser?.profilePictureUrl} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">{currentUser?.name ?? "…"}</p>
            <p className="text-[11px] text-gray-400 truncate">{currentUser?.mobileNumber}</p>
          </div>
        </Link>

        {/* Sign out */}
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-[240px] h-screen sticky top-0 border-r border-gray-100 dark:border-white/[0.04] bg-white dark:bg-[#0f0f13] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={closeSidebar}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-[#0f0f13] z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <button onClick={closeSidebar}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
