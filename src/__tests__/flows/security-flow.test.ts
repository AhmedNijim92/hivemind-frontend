import { describe, it, expect } from "vitest";
import { escapeHtml, stripHtml, sanitizeUrl, isSafeInput } from "@/utils/sanitize";

/**
 * Tests security flows — ensures XSS attacks are prevented at every layer.
 * These tests verify that user input is sanitized before storage/rendering.
 */
describe("Security Flow - XSS Prevention", () => {
  describe("User-generated content sanitization", () => {
    it("should prevent script injection in post content", () => {
      const maliciousContent = '<script>document.cookie</script>Hello';
      const safe = stripHtml(maliciousContent);
      expect(safe).toBe("document.cookieHello");
      expect(safe).not.toContain("<script>");
    });

    it("should prevent event handler injection in user names", () => {
      const maliciousName = 'Ahmed<img onerror="alert(1)" src=x>';
      const safe = stripHtml(maliciousName);
      expect(safe).not.toContain("onerror");
      expect(safe).toBe('Ahmed');
    });

    it("should escape HTML entities in chat messages for display", () => {
      const message = '<b>Bold</b> & "quoted" <a href="javascript:void(0)">link</a>';
      const escaped = escapeHtml(message);
      expect(escaped).not.toContain("<b>");
      expect(escaped).not.toContain("<a ");
      expect(escaped).toContain("&lt;b&gt;");
    });

    it("should block javascript: URLs in user-submitted links", () => {
      expect(sanitizeUrl("javascript:alert(document.domain)")).toBeNull();
      expect(sanitizeUrl("JAVASCRIPT:alert(1)")).toBeNull();
      expect(sanitizeUrl("  javascript:alert(1)")).toBeNull();
    });

    it("should block data: URLs with non-image content", () => {
      // data:text/html is dangerous
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    });

    it("should allow safe URLs", () => {
      expect(sanitizeUrl("https://hivemind.app/profile")).toBe("https://hivemind.app/profile");
      expect(sanitizeUrl("https://cdn.example.com/image.jpg")).toBe("https://cdn.example.com/image.jpg");
    });
  });

  describe("Input validation flow", () => {
    it("should detect XSS in form inputs", () => {
      expect(isSafeInput("Normal bio text")).toBe(true);
      expect(isSafeInput("<script>steal()</script>")).toBe(false);
      expect(isSafeInput('"><img src=x onerror=alert(1)>')).toBe(false);
      expect(isSafeInput("javascript:void(0)")).toBe(false);
    });

    it("should allow emojis and special characters in safe context", () => {
      expect(isSafeInput("Hello! 🎉 This is great & awesome")).toBe(true);
      expect(isSafeInput("User <3 this post")).toBe(true);
      expect(isSafeInput("Price: $100")).toBe(true);
    });
  });

  describe("URL sanitization for profile pictures", () => {
    it("should allow media service URLs", () => {
      expect(sanitizeUrl("/api/v1/media/uuid-123/download")).toBeNull(); // relative URLs need base
      expect(sanitizeUrl("https://app.hivemind.com/api/v1/media/123/download")).toBe("https://app.hivemind.com/api/v1/media/123/download");
    });

    it("should block FTP and other dangerous protocols", () => {
      expect(sanitizeUrl("ftp://malicious.com/payload")).toBeNull();
      expect(sanitizeUrl("file:///etc/shadow")).toBeNull();
      expect(sanitizeUrl("vbscript:msgbox")).toBeNull();
    });
  });
});
