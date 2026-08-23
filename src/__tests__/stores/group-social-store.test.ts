import { describe, it, expect, beforeEach } from "vitest";
import { useGroupSocialStore } from "@/store/group-social-store";

describe("GroupSocialStore", () => {
  beforeEach(() => {
    useGroupSocialStore.setState({ followers: {}, joinRequests: [] });
  });

  describe("Following", () => {
    it("should follow a group", () => {
      useGroupSocialStore.getState().followGroup("group-1", "user-1");
      expect(useGroupSocialStore.getState().isFollowingGroup("group-1", "user-1")).toBe(true);
    });

    it("should not duplicate followers", () => {
      useGroupSocialStore.getState().followGroup("group-1", "user-1");
      useGroupSocialStore.getState().followGroup("group-1", "user-1");
      expect(useGroupSocialStore.getState().getGroupFollowerCount("group-1")).toBe(1);
    });

    it("should unfollow a group", () => {
      useGroupSocialStore.getState().followGroup("group-1", "user-1");
      useGroupSocialStore.getState().unfollowGroup("group-1", "user-1");
      expect(useGroupSocialStore.getState().isFollowingGroup("group-1", "user-1")).toBe(false);
    });

    it("should count group followers", () => {
      useGroupSocialStore.getState().followGroup("group-1", "user-1");
      useGroupSocialStore.getState().followGroup("group-1", "user-2");
      useGroupSocialStore.getState().followGroup("group-1", "user-3");
      expect(useGroupSocialStore.getState().getGroupFollowerCount("group-1")).toBe(3);
    });

    it("should get groups followed by a user", () => {
      useGroupSocialStore.getState().followGroup("group-1", "user-1");
      useGroupSocialStore.getState().followGroup("group-2", "user-1");
      useGroupSocialStore.getState().followGroup("group-3", "user-2");

      const followed = useGroupSocialStore.getState().getGroupsFollowedByUser("user-1");
      expect(followed).toHaveLength(2);
      expect(followed).toContain("group-1");
      expect(followed).toContain("group-2");
    });
  });

  describe("Join Requests", () => {
    it("should create a join request", () => {
      useGroupSocialStore.getState().createJoinRequest("group-1", "user-1", "Ahmed", null);
      const pending = useGroupSocialStore.getState().getPendingRequests("group-1");
      expect(pending).toHaveLength(1);
      expect(pending[0].userId).toBe("user-1");
      expect(pending[0].status).toBe("pending");
    });

    it("should not duplicate pending join requests", () => {
      useGroupSocialStore.getState().createJoinRequest("group-1", "user-1", "Ahmed", null);
      useGroupSocialStore.getState().createJoinRequest("group-1", "user-1", "Ahmed", null);
      expect(useGroupSocialStore.getState().getPendingRequests("group-1")).toHaveLength(1);
    });

    it("should approve a join request", () => {
      useGroupSocialStore.getState().createJoinRequest("group-1", "user-1", "Ahmed", null);
      const reqId = useGroupSocialStore.getState().joinRequests[0].id;
      useGroupSocialStore.getState().approveJoinRequest(reqId, "admin-1");

      const req = useGroupSocialStore.getState().joinRequests[0];
      expect(req.status).toBe("approved");
      expect(req.reviewedBy).toBe("admin-1");
      expect(req.reviewedAt).not.toBeNull();
    });

    it("should reject a join request", () => {
      useGroupSocialStore.getState().createJoinRequest("group-1", "user-1", "Ahmed", null);
      const reqId = useGroupSocialStore.getState().joinRequests[0].id;
      useGroupSocialStore.getState().rejectJoinRequest(reqId, "admin-1");

      expect(useGroupSocialStore.getState().joinRequests[0].status).toBe("rejected");
    });

    it("should get user request status", () => {
      expect(useGroupSocialStore.getState().getUserRequestStatus("group-1", "user-1")).toBeNull();

      useGroupSocialStore.getState().createJoinRequest("group-1", "user-1", "Ahmed", null);
      expect(useGroupSocialStore.getState().getUserRequestStatus("group-1", "user-1")).toBe("pending");
    });

    it("should count pending requests per group", () => {
      useGroupSocialStore.getState().createJoinRequest("group-1", "user-1", "Ahmed", null);
      useGroupSocialStore.getState().createJoinRequest("group-1", "user-2", "Omar", null);
      expect(useGroupSocialStore.getState().getPendingRequestCount("group-1")).toBe(2);
    });
  });
});
