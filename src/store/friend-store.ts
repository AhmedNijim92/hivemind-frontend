/**
 * Friend store — persisted to localStorage.
 * Manages friend requests and friendships (mutual, like Facebook).
 * No backend API — client-side only.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  toUserId: string;
  toUserName: string;
  toUserAvatar: string | null;
  status: FriendRequestStatus;
  createdAt: string;
}

export interface Friendship {
  userA: string;
  userB: string;
  since: string; // ISO date
}

interface FriendStore {
  requests: FriendRequest[];
  friendships: Friendship[];

  // Send a friend request
  sendRequest: (from: { id: string; name: string; avatar: string | null }, to: { id: string; name: string; avatar: string | null }) => void;

  // Accept/reject a request
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;

  // Remove a friend
  removeFriend: (userA: string, userB: string) => void;

  // Queries
  areFriends: (userA: string, userB: string) => boolean;
  getFriends: (userId: string) => Friendship[];
  getFriendCount: (userId: string) => number;
  getPendingRequestsForUser: (userId: string) => FriendRequest[];
  getPendingRequestCount: (userId: string) => number;
  getRequestStatus: (fromUserId: string, toUserId: string) => FriendRequestStatus | null;
}

function makeId(): string {
  return `fr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useFriendStore = create<FriendStore>()(
  persist(
    (set, get) => ({
      requests: [],
      friendships: [],

      sendRequest: (from, to) => {
        const state = get();
        // Don't send if already friends
        if (state.areFriends(from.id, to.id)) return;
        // Don't send if already has a pending request in either direction
        const existing = state.requests.find(
          (r) =>
            r.status === "pending" &&
            ((r.fromUserId === from.id && r.toUserId === to.id) ||
              (r.fromUserId === to.id && r.toUserId === from.id))
        );
        if (existing) return;

        const request: FriendRequest = {
          id: makeId(),
          fromUserId: from.id,
          fromUserName: from.name,
          fromUserAvatar: from.avatar,
          toUserId: to.id,
          toUserName: to.name,
          toUserAvatar: to.avatar,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [request, ...s.requests] }));
      },

      acceptRequest: (requestId) => {
        const state = get();
        const req = state.requests.find((r) => r.id === requestId);
        if (!req || req.status !== "pending") return;

        const friendship: Friendship = {
          userA: req.fromUserId,
          userB: req.toUserId,
          since: new Date().toISOString(),
        };

        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === requestId ? { ...r, status: "accepted" as const } : r
          ),
          friendships: [...s.friendships, friendship],
        }));
      },

      rejectRequest: (requestId) => {
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === requestId ? { ...r, status: "rejected" as const } : r
          ),
        }));
      },

      removeFriend: (userA, userB) => {
        set((s) => ({
          friendships: s.friendships.filter(
            (f) =>
              !(
                (f.userA === userA && f.userB === userB) ||
                (f.userA === userB && f.userB === userA)
              )
          ),
        }));
      },

      areFriends: (userA, userB) => {
        return get().friendships.some(
          (f) =>
            (f.userA === userA && f.userB === userB) ||
            (f.userA === userB && f.userB === userA)
        );
      },

      getFriends: (userId) => {
        return get().friendships.filter(
          (f) => f.userA === userId || f.userB === userId
        );
      },

      getFriendCount: (userId) => {
        return get().friendships.filter(
          (f) => f.userA === userId || f.userB === userId
        ).length;
      },

      getPendingRequestsForUser: (userId) => {
        return get().requests.filter(
          (r) => r.toUserId === userId && r.status === "pending"
        );
      },

      getPendingRequestCount: (userId) => {
        return get().requests.filter(
          (r) => r.toUserId === userId && r.status === "pending"
        ).length;
      },

      getRequestStatus: (fromUserId, toUserId) => {
        const requests = get().requests.filter(
          (r) =>
            (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
            (r.fromUserId === toUserId && r.toUserId === fromUserId)
        );
        if (requests.length === 0) return null;
        const latest = [...requests].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        return latest.status;
      },
    }),
    {
      name: "hivemind-friends",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : sessionStorage
      ),
    }
  )
);
