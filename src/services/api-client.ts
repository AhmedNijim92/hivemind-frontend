/**
 * Centralized Axios instance.
 * - Attaches JWT from localStorage on every request
 * - Handles 401 → clears auth state and redirects to /login
 *   (only for non-auth endpoints to avoid logout loops)
 * - Normalizes error shapes into ApiError (extends Error)
 */
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store/auth-store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Custom error class that extends Error so unhandled rejections
 * display a proper message instead of [object Object].
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ─── Request interceptor: attach Bearer token ─────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== "undefined"
        ? useAuthStore.getState().token
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: normalize errors ───────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const url = error.config?.url ?? "";

    // Only auto-logout on 401 if:
    // 1. It's not an auth endpoint (avoid logout loop on login/register)
    // 2. It's not a network error (status 0 = server unreachable)
    // 3. We're in the browser
    const isAuthEndpoint = url.includes("/api/v1/auth/");
    if (status === 401 && !isAuthEndpoint && typeof window !== "undefined") {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    const message =
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      "An unexpected error occurred";

    return Promise.reject(new ApiError(status, message));
  }
);
