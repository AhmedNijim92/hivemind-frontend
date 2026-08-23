import { describe, it, expect, beforeEach } from "vitest";
import { useGroupContextStore } from "@/store/group-context-store";

describe("GroupContextStore", () => {
  beforeEach(() => {
    useGroupContextStore.setState({ activeGroupId: null, activeGroup: null });
  });

  it("should start with no active group", () => {
    const { activeGroupId, activeGroup } = useGroupContextStore.getState();
    expect(activeGroupId).toBeNull();
    expect(activeGroup).toBeNull();
  });

  it("should set active group", () => {
    const group = {
      groupId: "group-123",
      creatorId: "user-1",
      name: "Test Group",
      description: null,
      privacy: "PUBLIC" as const,
      memberCount: 5,
      profilePictureUrl: null,
      coverPictureUrl: null,
      createdAt: new Date().toISOString(),
    };

    useGroupContextStore.getState().setActiveGroup(group);
    const state = useGroupContextStore.getState();

    expect(state.activeGroupId).toBe("group-123");
    expect(state.activeGroup?.name).toBe("Test Group");
  });

  it("should clear active group", () => {
    const group = {
      groupId: "group-123",
      creatorId: "user-1",
      name: "Test",
      description: null,
      privacy: "PUBLIC" as const,
      memberCount: 1,
      profilePictureUrl: null,
      coverPictureUrl: null,
      createdAt: new Date().toISOString(),
    };

    useGroupContextStore.getState().setActiveGroup(group);
    useGroupContextStore.getState().clearActiveGroup();

    const state = useGroupContextStore.getState();
    expect(state.activeGroupId).toBeNull();
    expect(state.activeGroup).toBeNull();
  });
});
