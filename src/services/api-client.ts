/**
 * Centralized Axios instance with security hardening.
 * - Attaches JWT from auth store on every request
 * - Handles 401 → clears auth state and redirects to /login
 * - Normalizes error shapes into ApiError (extends Error)
 * - Strips dangerous content from outgoing requests
 * - Adds request ID for tracing
 */
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store/auth-store";
import { stripHtml } from "@/utils/sanitize";

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
  // Don't send cookies to third-party domains
  withCredentials: false,
});

/**
 * Recursively sanitize string values in an object to strip HTML tags.
 * Prevents stored XSS via API submissions.
 */
function sanitizePayload(data: unknown): unknown {
  if (typeof data === "string") return stripHtml(data);
  if (Array.isArray(data)) return data.map(sanitizePayload);
  if (data && typeof data === "object" && !(data instanceof FormData)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      sanitized[key] = sanitizePayload(value);
    }
    return sanitized;
  }
  return data;
}

// ─── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach JWT token
    const token =
      typeof window !== "undefined"
        ? useAuthStore.getState().token
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    config.headers["X-Request-Id"] = crypto.randomUUID?.() ?? `${Date.now()}`;

    // Sanitize JSON payloads (not FormData — that's for file uploads)
    if (config.data && !(config.data instanceof FormData)) {
      config.data = sanitizePayload(config.data);
    }

    // When sending FormData (file uploads), remove Content-Type header
    // so Axios/browser can set multipart/form-data with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const url = error.config?.url ?? "";

    // Auto-logout on 401 (except auth endpoints and network errors)
    const isAuthEndpoint = url.includes("/api/v1/auth/");
    if (status === 401 && !isAuthEndpoint && typeof window !== "undefined") {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    // Rate limited
    if (status === 429) {
      return Promise.reject(new ApiError(429, "Too many requests. Please wait a moment."));
    }

    const message =
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      "An unexpected error occurred";

    return Promise.reject(new ApiError(status, message));
  }
);
