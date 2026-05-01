"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Bell, User, Video } from "lucide-react";
import { cn } from "@/utils/cn";
import { useUnreadCount } from "@/hooks/use-notifications";

const navItems = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "/meetings", icon: Video, label: "Meetings" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadCount();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 safe-area-pb"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const isBell = href === "/notifications";

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
                {isBell && unreadCount && unreadCount > 0 ? (
                  <span
                    className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
