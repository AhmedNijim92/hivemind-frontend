"use client";

/**
 * Haptic feedback utility using navigator.vibrate API.
 * Falls back silently on unsupported devices.
 */
export function useHaptic() {
  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    /** Light tap — button press, toggle */
    tap: () => vibrate(10),
    /** Medium impact — successful action, send */
    impact: () => vibrate(20),
    /** Heavy — error, delete */
    heavy: () => vibrate([30, 10, 30]),
    /** Selection changed */
    selection: () => vibrate(5),
    /** Success pattern */
    success: () => vibrate([10, 50, 20]),
    /** Notification */
    notify: () => vibrate([15, 30, 15, 30, 15]),
  };
}
