import { describe, it, expect } from "vitest";
import { cn } from "@/utils/cn";

describe("cn (className utility)", () => {
  it("should merge simple classes", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });

  it("should handle undefined/null", () => {
    expect(cn("base", undefined, null)).toBe("base");
  });

  it("should merge conflicting Tailwind classes (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should handle array inputs", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });
});
