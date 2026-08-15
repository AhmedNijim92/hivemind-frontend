"use client";

import { Sun, Moon, Monitor, LogOut, Shield, Bell, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { TopBar } from "@/components/layout/top-bar";
import { PageTransition } from "@/components/ui/page-transition";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-user";
import { useLogout } from "@/hooks/use-auth";
import { useHaptic } from "@/hooks/use-haptic";
import { useAuthStore } from "@/store/auth-store";
import { usePageTitle } from "@/hooks/use-page-title";
import Link from "next/link";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  usePageTitle("Settings");
  const { data: profile } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const role = useAuthStore((s) => s.role);
  const haptic = useHaptic();

  return (
    <PageTransition>
      <TopBar title="Settings" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="hidden lg:block">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your account and preferences</p>
        </div>

        {/* Account */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 space-y-4"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-500" />
            Account
          </h2>
          <div className="flex items-center gap-4">
            <Avatar name={profile?.name} src={profile?.profilePictureUrl} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {profile?.name ?? "Loading…"}
              </p>
              <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
              <p className="text-sm text-gray-400 truncate">{profile?.mobileNumber}</p>
            </div>
            <Badge variant="brand">{role ?? "USER"}</Badge>
          </div>
          <div className="flex gap-2 pt-2">
            <Link href="/profile" className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                Edit profile
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Appearance */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 space-y-4"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand-500" />
            Appearance
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <motion.button
                key={value}
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptic.selection(); setTheme(value); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === value
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20 shadow-sm shadow-brand-500/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Icon className={`h-5 w-5 ${theme === value ? "text-brand-500" : "text-gray-400"}`} />
                <span className={`text-sm font-medium ${theme === value ? "text-brand-600 dark:text-brand-400" : "text-gray-600 dark:text-gray-400"}`}>
                  {label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5 space-y-4"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-500" />
            Notifications
          </h2>
          <p className="text-sm text-gray-500">
            Notification preferences will be available in a future update.
            Currently, all notifications are enabled by default.
          </p>
        </motion.section>

        {/* Danger zone */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5 space-y-4 border-red-200 dark:border-red-900/50"
        >
          <h2 className="font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
          <Button variant="danger" onClick={() => { haptic.heavy(); logout(); }} className="w-full">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </motion.section>

        {/* App info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center text-xs text-gray-400 py-4 space-y-1"
        >
          <p>HiveMind v1.0.0</p>
          <p>Built with Next.js, Tailwind CSS, and TanStack Query</p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
