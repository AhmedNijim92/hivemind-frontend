"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageCircle, Bell, User } from "lucide-react";
import { motion } from "framer-motion";
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
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden glass border-t border-white/[0.06] safe-area-pb"
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
                "relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-300",
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              {/* Active pill background */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 bg-brand-50 dark:bg-brand-950/30 rounded-2xl"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  animate={isActive ? { y: -1 } : { y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </motion.div>
                {badgeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm shadow-red-500/40"
                    aria-label={`${badgeCount} unread`}
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </motion.span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium relative z-10 transition-colors",
                isActive && "font-semibold"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
