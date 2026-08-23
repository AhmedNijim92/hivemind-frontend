import { describe, it, expect, beforeEach } from "vitest";
import { useFriendStore } from "@/store/friend-store";

describe("FriendStore", () => {
  beforeEach(() => {
    useFriendStore.setState({ requests: [], friendships: [] });
  });

  const userA = { id: "user-a", name: "Ahmed", avatar: null };
  const userB = { id: "user-b", name: "Omar", avatar: null };

  describe("Friend Requests", () => {
    it("should send a friend request", () => {
      useFriendStore.getState().sendRequest(userA, userB);
      const requests = useFriendStore.getState().requests;
      expect(requests).toHaveLength(1);
      expect(requests[0].fromUserId).toBe("user-a");
      expect(requests[0].toUserId).toBe("user-b");
      expect(requests[0].status).toBe("pending");
    });

    it("should not send duplicate pending requests", () => {
      useFriendStore.getState().sendRequest(userA, userB);
      useFriendStore.getState().sendRequest(userA, userB);
      expect(useFriendStore.getState().requests).toHaveLength(1);
    });

    it("should not send request if already friends", () => {
      useFriendStore.getState().sendRequest(userA, userB);
      useFriendStore.getState().acceptRequest(useFriendStore.getState().requests[0].id);
      // Try to send again
      useFriendStore.getState().sendRequest(userA, userB);
      // Should still be only 1 request (the accepted one)
      expect(useFriendStore.getState().requests).toHaveLength(1);
    });

    it("should accept a friend request", () => {
      useFriendStore.getState().sendRequest(userA, userB);
      const reqId = useFriendStore.getState().requests[0].id;
      useFriendStore.getState().acceptRequest(reqId);

      expect(useFriendStore.getState().requests[0].status).toBe("accepted");
      expect(useFriendStore.getState().friendships).toHaveLength(1);
    });

    it("should reject a friend request", () => {
      useFriendStore.getState().sendRequest(userA, userB);
      const reqId = useFriendStore.getState().requests[0].id;
      useFriendStore.getState().rejectRequest(reqId);

      expect(useFriendStore.getState().requests[0].status).toBe("rejected");
      expect(useFriendStore.getState().friendships).toHaveLength(0);
    });

    it("should get pending requests for a user", () => {
      useFriendStore.getState().sendRequest(userA, userB);
      const pending = useFriendStore.getState().getPendingRequestsForUser("user-b");
      expect(pending).toHaveLength(1);
      expect(useFriendStore.getState().getPendingRequestCount("user-b")).toBe(1);
      expect(useFriendStore.getState().getPendingRequestCount("user-a")).toBe(0);
    });
  });

  describe("Friendships", () => {
    it("should check if two users are friends", () => {
      expect(useFriendStore.getState().areFriends("user-a", "user-b")).toBe(false);

      useFriendStore.getState().sendRequest(userA, userB);
      useFriendStore.getState().acceptRequest(useFriendStore.getState().requests[0].id);

      expect(useFriendStore.getState().areFriends("user-a", "user-b")).toBe(true);
      // Bidirectional
      expect(useFriendStore.getState().areFriends("user-b", "user-a")).toBe(true);
    });

    it("should remove a friend", () => {
      useFriendStore.getState().sendRequest(userA, userB);
      useFriendStore.getState().acceptRequest(useFriendStore.getState().requests[0].id);
      useFriendStore.getState().removeFriend("user-a", "user-b");

      expect(useFriendStore.getState().areFriends("user-a", "user-b")).toBe(false);
      expect(useFriendStore.getState().friendships).toHaveLength(0);
    });

    it("should count friends", () => {
      useFriendStore.getState().sendRequest(userA, userB);
      useFriendStore.getState().acceptRequest(useFriendStore.getState().requests[0].id);

      expect(useFriendStore.getState().getFriendCount("user-a")).toBe(1);
      expect(useFriendStore.getState().getFriendCount("user-b")).toBe(1);
    });

    it("should get request status", () => {
      expect(useFriendStore.getState().getRequestStatus("user-a", "user-b")).toBeNull();

      useFriendStore.getState().sendRequest(userA, userB);
      expect(useFriendStore.getState().getRequestStatus("user-a", "user-b")).toBe("pending");
    });
  });
});
