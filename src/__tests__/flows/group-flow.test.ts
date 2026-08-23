import { describe, it, expect, beforeEach } from "vitest";
import { useGroupContextStore } from "@/store/group-context-store";
import { useGroupSocialStore } from "@/store/group-social-store";
import { useStoryStore } from "@/store/story-store";
import type { GroupDto } from "@/types";
import type { Story } from "@/types/story";

/**
 * Tests group-related flows:
 * - Select group → view feed → create story
 * - Join request flow for private groups
 * - Group following and unfollowing
 */
describe("Group Flow", () => {
  beforeEach(() => {
    useGroupContextStore.setState({ activeGroupId: null, activeGroup: null });
    useGroupSocialStore.setState({ followers: {}, joinRequests: [] });
    useStoryStore.setState({ stories: [] });
  });

  const mockGroup: GroupDto = {
    groupId: "group-abc",
    creatorId: "admin-1",
    name: "HiveMind Community",
    description: "A test group",
    privacy: "PUBLIC",
    memberCount: 42,
    profilePictureUrl: "/media/group-pic.jpg",
    coverPictureUrl: null,
    createdAt: new Date().toISOString(),
  };

  describe("Group Selection Flow", () => {
    it("should select a group and make it active", () => {
      useGroupContextStore.getState().setActiveGroup(mockGroup);

      const state = useGroupContextStore.getState();
      expect(state.activeGroupId).toBe("group-abc");
      expect(state.activeGroup?.name).toBe("HiveMind Community");
      expect(state.activeGroup?.profilePictureUrl).toBe("/media/group-pic.jpg");
    });

    it("should switch between groups", () => {
      const group2: GroupDto = { ...mockGroup, groupId: "group-xyz", name: "Second Group" };

      useGroupContextStore.getState().setActiveGroup(mockGroup);
      useGroupContextStore.getState().setActiveGroup(group2);

      expect(useGroupContextStore.getState().activeGroupId).toBe("group-xyz");
      expect(useGroupContextStore.getState().activeGroup?.name).toBe("Second Group");
    });
  });

  describe("Private Group Join Request Flow", () => {
    it("should handle the full join request lifecycle for private groups", () => {
      const store = useGroupSocialStore.getState;

      // User requests to join
      store().createJoinRequest("private-group", "user-1", "Ahmed", "/avatar.jpg");
      expect(store().getUserRequestStatus("private-group", "user-1")).toBe("pending");
      expect(store().getPendingRequestCount("private-group")).toBe(1);

      // Admin approves
      const req = store().getPendingRequests("private-group")[0];
      store().approveJoinRequest(req.id, "admin-1");

      expect(store().getUserRequestStatus("private-group", "user-1")).toBe("approved");
      expect(store().getPendingRequestCount("private-group")).toBe(0);
    });

    it("should handle join request rejection", () => {
      const store = useGroupSocialStore.getState;

      store().createJoinRequest("private-group", "user-1", "Ahmed", null);
      const req = store().getPendingRequests("private-group")[0];
      store().rejectJoinRequest(req.id, "admin-1");

      expect(store().getUserRequestStatus("private-group", "user-1")).toBe("rejected");
    });
  });

  describe("Group Follow Flow", () => {
    it("should follow and unfollow groups", () => {
      const store = useGroupSocialStore.getState;

      // Follow multiple groups
      store().followGroup("group-1", "user-1");
      store().followGroup("group-2", "user-1");
      store().followGroup("group-3", "user-1");

      expect(store().getGroupsFollowedByUser("user-1")).toHaveLength(3);
      expect(store().getGroupFollowerCount("group-1")).toBe(1);

      // Unfollow one
      store().unfollowGroup("group-2", "user-1");
      expect(store().getGroupsFollowedByUser("user-1")).toHaveLength(2);
      expect(store().isFollowingGroup("group-2", "user-1")).toBe(false);
    });
  });

  describe("Story within Group Flow", () => {
    it("should create a story for the active group", () => {
      // Set active group
      useGroupContextStore.getState().setActiveGroup(mockGroup);

      // Create story
      const story: Story = {
        id: "story-1",
        groupId: mockGroup.groupId,
        groupName: mockGroup.name,
        userId: "user-1",
        userName: "Ahmed",
        userAvatar: null,
        mediaUrl: "/media/story.jpg",
        caption: "Check this out!",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        viewedBy: ["user-1"],
      };

      useStoryStore.getState().addStory(story);
      const groups = useStoryStore.getState().getGroupedStories("user-1");

      expect(groups).toHaveLength(1);
      expect(groups[0].groupId).toBe("group-abc");
      expect(groups[0].groupName).toBe("HiveMind Community");
      expect(groups[0].stories).toHaveLength(1);
    });

    it("should show unviewed stories from other groups", () => {
      const story: Story = {
        id: "story-2",
        groupId: "other-group",
        groupName: "Other Group",
        userId: "user-2",
        userName: "Omar",
        userAvatar: null,
        mediaUrl: "/media/other.jpg",
        caption: null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        viewedBy: ["user-2"], // only creator viewed it
      };

      useStoryStore.getState().addStory(story);
      const groups = useStoryStore.getState().getGroupedStories("user-1");

      expect(groups[0].hasUnviewed).toBe(true);

      // User views it
      useStoryStore.getState().viewStory("story-2", "user-1");
      const updated = useStoryStore.getState().getGroupedStories("user-1");
      expect(updated[0].hasUnviewed).toBe(false);
    });
  });
});
