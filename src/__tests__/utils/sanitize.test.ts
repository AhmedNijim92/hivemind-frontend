import { describe, it, expect } from "vitest";
import { escapeHtml, stripHtml, sanitizeUrl, isSafeInput } from "@/utils/sanitize";

describe("escapeHtml", () => {
  it("should escape < and >", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
    );
  });

  it("should escape quotes", () => {
    expect(escapeHtml('"hello" & \'world\'')).toBe("&quot;hello&quot; &amp; &#x27;world&#x27;");
  });

  it("should not modify safe strings", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("stripHtml", () => {
  it("should remove HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("should handle self-closing tags", () => {
    expect(stripHtml("Hello<br/>World")).toBe("HelloWorld");
  });

  it("should handle strings without HTML", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
});

describe("sanitizeUrl", () => {
  it("should allow http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("should allow https URLs", () => {
    expect(sanitizeUrl("https://example.com/path")).toBe("https://example.com/path");
  });

  it("should allow data: URLs (for images)", () => {
    expect(sanitizeUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });

  it("should reject javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
  });

  it("should reject file: URLs", () => {
    expect(sanitizeUrl("file:///etc/passwd")).toBeNull();
  });

  it("should handle null/undefined", () => {
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl(undefined)).toBeNull();
    expect(sanitizeUrl("")).toBeNull();
  });

  it("should reject invalid URLs", () => {
    expect(sanitizeUrl("not-a-url")).toBeNull();
  });
});

describe("isSafeInput", () => {
  it("should pass normal text", () => {
    expect(isSafeInput("Hello World")).toBe(true);
  });

  it("should detect script tags", () => {
    expect(isSafeInput("<script>alert(1)</script>")).toBe(false);
  });

  it("should detect javascript: in content", () => {
    expect(isSafeInput("javascript:void(0)")).toBe(false);
  });

  it("should detect inline event handlers", () => {
    expect(isSafeInput('onclick="alert(1)"')).toBe(false);
    expect(isSafeInput("onload=hack()")).toBe(false);
  });

  it("should allow normal special characters", () => {
    expect(isSafeInput("Hello & goodbye <3")).toBe(true);
  });
});
