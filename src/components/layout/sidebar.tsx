"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Bell,
  User,
  Video,
  Plus,
  LogOut,
  Sun,
  Moon,
  X,
  Search,
  Settings,
  MessageCircle,
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

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  unreadCount,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: boolean;
  unreadCount?: number;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/nav",
        isActive
          ? "text-brand-600 dark:text-brand-400 font-semibold"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      )}
    >
      {/* Active pill background */}
      {isActive && (
        <motion.div
          layoutId="sidebar-pill"
          className="absolute inset-0 bg-brand-50 dark:bg-brand-950/30 rounded-xl border border-brand-100/50 dark:border-brand-800/20"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}

      {/* Hover background */}
      {!isActive && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover/nav:opacity-100 bg-gray-100/60 dark:bg-white/[0.03] transition-opacity" />
      )}

      <div className="relative z-10">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Icon className="h-5 w-5 flex-shrink-0" />
        </motion.div>
        {badge && unreadCount && unreadCount > 0 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-red-500/40"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        ) : null}
      </div>
      <span className="text-sm relative z-10">{label}</span>
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
      <div className="px-4 py-5 mb-2">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
            className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-md shadow-brand-500/20"
          >
            <span className="text-white font-bold text-sm">H</span>
          </motion.div>
          <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
            Hive<span className="text-gradient">Mind</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            unreadCount={
              item.href === "/chat"
                ? chatUnread
                : item.href === "/notifications"
                  ? (unreadCount ?? 0)
                  : 0
            }
            onClick={closeSidebar}
          />
        ))}

        {/* Search */}
        <button
          onClick={() => { openSearch(); closeSidebar(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 group/search"
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Search className="h-5 w-5 flex-shrink-0" />
          </motion.div>
          <span className="text-sm">Search</span>
          <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100/80 dark:bg-white/[0.05] px-1.5 py-0.5 rounded-md font-mono border border-gray-200/50 dark:border-white/[0.06]">
            ⌘K
          </kbd>
        </button>
      </nav>

      {/* Quick actions */}
      <div className="px-3 py-3 space-y-1.5 border-t border-gray-100/60 dark:border-white/[0.04]">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { openCreatePost(); closeSidebar(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-button bg-gradient-brand text-white shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-shadow btn-shimmer"
        >
          <Plus className="h-4 w-4" />
          New Post
        </motion.button>
        <button
          onClick={() => { openCreateGroup(); closeSidebar(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/[0.03] transition-colors"
        >
          <Users className="h-4 w-4" />
          New Group
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100/60 dark:border-white/[0.04] space-y-0.5">
        {/* Active group context */}
        <ActiveGroupBanner className="mb-2" />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/[0.03] transition-colors"
        >
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </motion.div>
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/[0.03] transition-colors"
          onClick={closeSidebar}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        {/* User */}
        <Link
          href={`/profile/${userId}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/60 dark:hover:bg-white/[0.03] transition-colors"
          onClick={closeSidebar}
        >
          <Avatar name={currentUser?.name} size="sm" src={currentUser?.profilePictureUrl} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {currentUser?.name ?? "Loading…"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {currentUser?.mobileNumber}
            </p>
          </div>
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] h-screen sticky top-0 border-r border-gray-100/60 dark:border-white/[0.04] bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={closeSidebar}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] glass z-50 lg:hidden overflow-y-auto"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeSidebar}
                className="absolute top-4 right-4 p-2 rounded-xl bg-gray-100/80 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </motion.button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
