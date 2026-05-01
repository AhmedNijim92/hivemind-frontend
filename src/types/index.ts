export * from "./auth";
export * from "./user";
export * from "./group";
export * from "./post";
export * from "./meeting";
export * from "./notification";
export * from "./media";

// ─── Shared ───────────────────────────────────────────────────────────────────

// ApiError is now a class in services/api-client.ts (extends Error)
// Re-export it for convenience
export { ApiError } from "@/services/api-client";

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
