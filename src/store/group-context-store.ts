/**
 * Group context store — session-scoped state for active group context.
 * Persisted to sessionStorage (clears when browser closes per requirement 1.6).
 * Holds the currently active group the user is operating under.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GroupDto } from "@/types";

interface GroupContextStore {
  activeGroupId: string | null;
  activeGroup: GroupDto | null;

  setActiveGroup: (group: GroupDto) => void;
  clearActiveGroup: () => void;
}

export const useGroupContextStore = create<GroupContextStore>()(
  persist(
    (set) => ({
      activeGroupId: null,
      activeGroup: null,

      setActiveGroup: (group: GroupDto) =>
        set({
          activeGroupId: group.groupId,
          activeGroup: group,
        }),

      clearActiveGroup: () =>
        set({
          activeGroupId: null,
          activeGroup: null,
        }),
    }),
    {
      name: "hivemind-group-context",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : sessionStorage
      ),
    }
  )
);
