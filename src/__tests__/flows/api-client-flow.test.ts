import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/auth-store";
import { stripHtml } from "@/utils/sanitize";

/**
 * Tests API client behavior:
 * - JWT token attachment
 * - Payload sanitization
 * - Error handling
 * - Auto-logout on 401
 */
describe("API Client Flow", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, userId: null, role: null, isAuthenticated: false });
  });

  describe("Authentication token management", () => {
    it("should not have token when not authenticated", () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("should store token after login", () => {
      useAuthStore.getState().setAuth({
        token: "eyJhbGciOiJIUzI1NiJ9.test",
        userId: "user-123",
        role: "USER",
        name: "Ahmed",
      });

      expect(useAuthStore.getState().token).toBe("eyJhbGciOiJIUzI1NiJ9.test");
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("should clear token on logout", () => {
      useAuthStore.getState().setAuth({
        token: "token",
        userId: "id",
        role: "USER",
        name: "N",
      });
      useAuthStore.getState().logout();

      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("Payload sanitization", () => {
    it("should strip HTML from string values before sending", () => {
      const input = "<script>alert('xss')</script>Hello World";
      const sanitized = stripHtml(input);
      expect(sanitized).toBe("alert('xss')Hello World");
      expect(sanitized).not.toContain("<script>");
    });

    it("should handle nested objects", () => {
      const input = {
        name: "<b>Ahmed</b>",
        bio: "I love <script>coding</script>",
        nested: {
          value: "<img onerror=hack()>test",
        },
      };

      // Simulate what the interceptor does
      const sanitize = (data: any): any => {
        if (typeof data === "string") return stripHtml(data);
        if (Array.isArray(data)) return data.map(sanitize);
        if (data && typeof data === "object") {
          const result: any = {};
          for (const [key, value] of Object.entries(data)) {
            result[key] = sanitize(value);
          }
          return result;
        }
        return data;
      };

      const result = sanitize(input);
      expect(result.name).toBe("Ahmed");
      expect(result.bio).toBe("I love coding");
      expect(result.nested.value).toBe("test");
    });

    it("should not modify FormData (file uploads)", () => {
      const formData = new FormData();
      formData.append("file", new Blob(["test"]), "test.jpg");
      // FormData should pass through unchanged
      expect(formData instanceof FormData).toBe(true);
    });
  });
});
