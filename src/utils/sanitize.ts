/**
 * Sanitizes user-generated content to prevent XSS attacks.
 * Escapes HTML entities in strings before rendering.
 */

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

const ESCAPE_REGEX = /[&<>"'/]/g;

/**
 * Escapes HTML special characters in a string.
 * Use this for any user-generated content that will be rendered as text.
 */
export function escapeHtml(str: string): string {
  return str.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] || char);
}

/**
 * Strips all HTML tags from a string.
 * Use this for content that should be plain text only.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Validates and sanitizes a URL.
 * Only allows http, https, and data: (for images) protocols.
 * Returns null if the URL is potentially dangerous.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (["http:", "https:", "data:"].includes(parsed.protocol)) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates that a string doesn't contain script injection patterns.
 * Returns true if the input is safe.
 */
export function isSafeInput(str: string): boolean {
  const dangerous = /<script|javascript:|on\w+\s*=/i;
  return !dangerous.test(str);
}
