"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useGroupContextStore } from "@/store/group-context-store";

/**
 * Guard that redirects to group selection screen if no active group context is set.
 * Wraps protected routes that require an active group context.
 * Exempt routes: select-group, chat (accessible across all groups), settings, profile.
 */
const EXEMPT_ROUTES = ["/select-group", "/chat", "/settings", "/profile", "/notifications"];

export function GroupContextGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeGroupId = useGroupContextStore((s) => s.activeGroupId);

  const isExemptRoute = EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  useEffect(() => {
    if (!activeGroupId && !isExemptRoute) {
      router.replace("/select-group");
    }
  }, [activeGroupId, isExemptRoute, router]);

  // If no group context and not exempt, don't render children
  if (!activeGroupId && !isExemptRoute) {
    return null;
  }

  return <>{children}</>;
}
