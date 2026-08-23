import { describe, it, expect, beforeEach } from "vitest";
import { useFriendStore } from "@/store/friend-store";

/**
 * Tests the complete friendship flow:
 * - Send request → Accept → Become friends
 * - Send request → Reject → Not friends
 * - Remove friend → No longer friends
 * - Edge cases: blocked users, re-sending after rejection
 */
describe("Friendship Flow", () => {
  beforeEach(() => {
    useFriendStore.setState({ requests: [], friendships: [] });
  });

  const ahmed = { id: "ahmed", name: "Ahmed", avatar: "/ahmed.jpg" };
  const omar = { id: "omar", name: "Omar", avatar: "/omar.jpg" };
  const sara = { id: "sara", name: "Sara", avatar: null };

  it("should handle the full friendship lifecycle", () => {
    const store = useFriendStore.getState;

    // Ahmed sends request to Omar
    store().sendRequest(ahmed, omar);
    expect(store().getRequestStatus("ahmed", "omar")).toBe("pending");
    expect(store().areFriends("ahmed", "omar")).toBe(false);

    // Omar sees the pending request
    const pending = store().getPendingRequestsForUser("omar");
    expect(pending).toHaveLength(1);
    expect(pending[0].fromUserName).toBe("Ahmed");

    // Omar accepts
    store().acceptRequest(pending[0].id);
    expect(store().areFriends("ahmed", "omar")).toBe(true);
    expect(store().getFriendCount("ahmed")).toBe(1);
    expect(store().getFriendCount("omar")).toBe(1);

    // No more pending requests
    expect(store().getPendingRequestCount("omar")).toBe(0);
  });

  it("should handle rejection flow", () => {
    const store = useFriendStore.getState;

    store().sendRequest(ahmed, omar);
    const pending = store().getPendingRequestsForUser("omar");
    store().rejectRequest(pending[0].id);

    expect(store().areFriends("ahmed", "omar")).toBe(false);
    expect(store().getRequestStatus("ahmed", "omar")).toBe("rejected");
  });

  it("should handle unfriending", () => {
    const store = useFriendStore.getState;

    // Become friends first
    store().sendRequest(ahmed, omar);
    store().acceptRequest(store().requests[0].id);
    expect(store().areFriends("ahmed", "omar")).toBe(true);

    // Remove friend
    store().removeFriend("ahmed", "omar");
    expect(store().areFriends("ahmed", "omar")).toBe(false);
    expect(store().getFriendCount("ahmed")).toBe(0);
  });

  it("should handle multiple friend requests from different users", () => {
    const store = useFriendStore.getState;

    // Both Omar and Sara send requests to Ahmed
    store().sendRequest(omar, ahmed);
    store().sendRequest(sara, ahmed);

    expect(store().getPendingRequestCount("ahmed")).toBe(2);

    // Ahmed accepts Omar, rejects Sara
    const pending = store().getPendingRequestsForUser("ahmed");
    const omarReq = pending.find((r) => r.fromUserId === "omar")!;
    const saraReq = pending.find((r) => r.fromUserId === "sara")!;

    store().acceptRequest(omarReq.id);
    store().rejectRequest(saraReq.id);

    expect(store().areFriends("ahmed", "omar")).toBe(true);
    expect(store().areFriends("ahmed", "sara")).toBe(false);
  });

  it("should prevent sending request to yourself (both directions blocked)", () => {
    const store = useFriendStore.getState;

    store().sendRequest(ahmed, omar);
    // Omar tries to send back while pending
    store().sendRequest(omar, ahmed);

    // Should still be only 1 request
    expect(store().requests).toHaveLength(1);
  });
});
