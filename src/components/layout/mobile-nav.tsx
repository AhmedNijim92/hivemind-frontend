"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageCircle, Bell, User } from "lucide-react";
import { cn } from "@/utils/cn";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useTotalUnread } from "@/hooks/use-chat";

const navItems = [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: unreadNotifs } = useUnreadCount();
  const chatUnread = useTotalUnread();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 safe-area-pb"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const badgeCount =
            href === "/notifications"
              ? (unreadNotifs ?? 0)
              : href === "/chat"
                ? chatUnread
                : 0;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative",
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                    aria-label={`${badgeCount} unread`}
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
