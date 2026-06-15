import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";

/**
 * Monitors JWT token expiry and auto-logs out the user
 * when the token is about to expire (1 minute before).
 * Also detects already-expired tokens on app load.
 */
export function useTokenExpiry() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!token) return;

    try {
      // Decode JWT payload (base64url)
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const exp = payload.exp * 1000; // Convert to ms
      const now = Date.now();

      // Already expired
      if (now >= exp) {
        logout();
        toast.error("Session expired. Please sign in again.");
        return;
      }

      // Set timer for 1 minute before expiry
      const timeUntilExpiry = exp - now - 60_000; // 1 min buffer
      if (timeUntilExpiry <= 0) {
        // Less than 1 min left — logout now
        logout();
        toast.error("Session expired. Please sign in again.");
        return;
      }

      const timer = setTimeout(() => {
        logout();
        toast("Session expired", { icon: "⏰" });
      }, timeUntilExpiry);

      return () => clearTimeout(timer);
    } catch {
      // Invalid token format — logout
      logout();
    }
  }, [token, logout]);
}
