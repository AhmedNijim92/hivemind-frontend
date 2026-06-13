/**
 * Runtime configuration that reads API URL from the server environment.
 * This allows NEXT_PUBLIC_API_URL to be set at deploy time (via Helm values)
 * without rebuilding the Docker image.
 *
 * Priority:
 * 1. Window injected config (set by _document or layout script)
 * 2. Build-time NEXT_PUBLIC_API_URL (if non-empty)
 * 3. Relative URL "" (same-origin, works with ingress/proxy)
 */

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      NEXT_PUBLIC_API_URL?: string;
    };
  }
}

let cachedApiUrl: string | null = null;

export function getApiBaseUrl(): string {
  if (cachedApiUrl !== null) return cachedApiUrl;

  // 1. Runtime injected config (from server-side rendering)
  if (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.NEXT_PUBLIC_API_URL) {
    cachedApiUrl = window.__RUNTIME_CONFIG__.NEXT_PUBLIC_API_URL;
    return cachedApiUrl;
  }

  // 2. Build-time env var (if it was set during docker build)
  if (process.env.NEXT_PUBLIC_API_URL) {
    cachedApiUrl = process.env.NEXT_PUBLIC_API_URL;
    return cachedApiUrl;
  }

  // 3. Empty string = relative URL (same origin, works behind ingress/proxy)
  cachedApiUrl = "";
  return cachedApiUrl;
}
