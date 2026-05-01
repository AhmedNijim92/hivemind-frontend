/**
 * Auth store — persisted to localStorage.
 * Holds JWT token, userId, role.
 * All API calls read from this store via the axios interceptor.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { JwtAuthResponse } from "@/types";

interface AuthStore {
  token: string | null;
  userId: string | null;
  role: string | null;
  isAuthenticated: boolean;

  setAuth: (response: JwtAuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      role: null,
      isAuthenticated: false,

      setAuth: (response: JwtAuthResponse) =>
        set({
          token: response.token,
          userId: response.userId,
          role: response.role,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          userId: null,
          role: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "hivemind-auth",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : sessionStorage
      ),
    }
  )
);
