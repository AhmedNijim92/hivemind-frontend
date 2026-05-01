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
  Menu,
  X,
  Search,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-user";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useUIStore } from "@/store/ui-store";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/meetings", icon: Video, label: "Meetings" },
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
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
        isActive
          ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
      )}
    >
      <div className="relative">
        <Icon className="h-5 w-5 flex-shrink-0" />
        {badge && unreadCount && unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </div>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const { data: currentUser } = useCurrentUser();
  const { data: unreadCount } = useUnreadCount();
  const { openCreatePost, openCreateGroup, isSidebarOpen, closeSidebar } = useUIStore();
  const openSearch = useUIStore((s) => s.openSearch);
  const { resolvedTheme, setTheme } = useTheme();
  const logout = useLogout();
  const userId = useAuthStore((s) => s.userId);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-3 py-4 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            HiveMind
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            unreadCount={unreadCount ?? 0}
            onClick={closeSidebar}
          />
        ))}

        {/* Search */}
        <button
          onClick={() => { openSearch(); closeSidebar(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
        >
          <Search className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">Search</span>
          <kbd className="ml-auto text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </button>
      </nav>

      {/* Quick actions */}
      <div className="px-2 py-3 space-y-1 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => { openCreatePost(); closeSidebar(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Post
        </button>
        <button
          onClick={() => { openCreateGroup(); closeSidebar(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Users className="h-4 w-4" />
          New Group
        </button>
      </div>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={closeSidebar}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        {/* User */}
        <Link
          href={`/profile/${userId}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark overflow-y-auto">
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
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={closeSidebar}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-surface-dark z-50 lg:hidden overflow-y-auto"
            >
              <button
                onClick={closeSidebar}
                className="absolute top-4 right-4 btn-ghost p-1.5"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
