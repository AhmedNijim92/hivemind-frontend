import { describe, it, expect } from "vitest";
import { formatNumber, timeAgo } from "@/utils/format";

describe("formatNumber", () => {
  it("should format small numbers as-is", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });

  it("should format thousands with K suffix", () => {
    expect(formatNumber(1000)).toBe("1.0K");
    expect(formatNumber(1500)).toBe("1.5K");
    expect(formatNumber(9999)).toBe("10.0K");
  });

  it("should format millions with M suffix", () => {
    expect(formatNumber(1000000)).toBe("1.0M");
    expect(formatNumber(2500000)).toBe("2.5M");
  });
});

describe("timeAgo", () => {
  it("should return a time-ago string for recent times", () => {
    const now = new Date().toISOString();
    const result = timeAgo(now);
    expect(result).toMatch(/ago|less than/i);
  });

  it("should return a time-ago string for older times", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = timeAgo(fiveMinAgo);
    expect(result).toMatch(/minutes ago|ago/i);
  });

  it("should handle invalid input gracefully", () => {
    const result = timeAgo("invalid-date");
    expect(result).toBe("invalid-date"); // returns original on error
  });
});
