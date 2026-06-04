/**
 * Group social store — persisted to localStorage.
 * Manages group followers and join requests (client-side, no backend API).
 *
 * - Users can FOLLOW any group (public or private) to get updates
 * - Users can REQUEST to JOIN a private group (admin must approve)
 * - Public groups: join is instant. Private groups: join creates a pending request.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  status: JoinRequestStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

interface GroupSocialStore {
  // Group followers: groupId -> Set of userIds
  followers: Record<string, string[]>;

  // Join requests
  joinRequests: JoinRequest[];

  // Follow/unfollow a group
  followGroup: (groupId: string, userId: string) => void;
  unfollowGroup: (groupId: string, userId: string) => void;
  isFollowingGroup: (groupId: string, userId: string) => boolean;
  getGroupFollowerCount: (groupId: string) => number;
  getGroupsFollowedByUser: (userId: string) => string[];

  // Join requests
  createJoinRequest: (groupId: string, userId: string, userName: string, userAvatar: string | null) => void;
  approveJoinRequest: (requestId: string, reviewerId: string) => void;
  rejectJoinRequest: (requestId: string, reviewerId: string) => void;
  getPendingRequests: (groupId: string) => JoinRequest[];
  getUserRequestStatus: (groupId: string, userId: string) => JoinRequestStatus | null;
  getPendingRequestCount: (groupId: string) => number;
}

export const useGroupSocialStore = create<GroupSocialStore>()(
  persist(
    (set, get) => ({
      followers: {},
      joinRequests: [],

      followGroup: (groupId, userId) => {
        set((s) => {
          const current = s.followers[groupId] ?? [];
          if (current.includes(userId)) return s;
          return { followers: { ...s.followers, [groupId]: [...current, userId] } };
        });
      },

      unfollowGroup: (groupId, userId) => {
        set((s) => {
          const current = s.followers[groupId] ?? [];
          return { followers: { ...s.followers, [groupId]: current.filter((id) => id !== userId) } };
        });
      },

      isFollowingGroup: (groupId, userId) => {
        return (get().followers[groupId] ?? []).includes(userId);
      },

      getGroupFollowerCount: (groupId) => {
        return (get().followers[groupId] ?? []).length;
      },

      getGroupsFollowedByUser: (userId) => {
        const { followers } = get();
        return Object.entries(followers)
          .filter(([, ids]) => ids.includes(userId))
          .map(([groupId]) => groupId);
      },

      createJoinRequest: (groupId, userId, userName, userAvatar) => {
        const state = get();
        // Check if already has a pending request
        const existing = state.joinRequests.find(
          (r) => r.groupId === groupId && r.userId === userId && r.status === "pending"
        );
        if (existing) return;

        const request: JoinRequest = {
          id: `jr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          groupId,
          userId,
          userName,
          userAvatar,
          status: "pending",
          createdAt: new Date().toISOString(),
          reviewedAt: null,
          reviewedBy: null,
        };

        set((s) => ({ joinRequests: [request, ...s.joinRequests] }));
      },

      approveJoinRequest: (requestId, reviewerId) => {
        set((s) => ({
          joinRequests: s.joinRequests.map((r) =>
            r.id === requestId
              ? { ...r, status: "approved" as const, reviewedAt: new Date().toISOString(), reviewedBy: reviewerId }
              : r
          ),
        }));
      },

      rejectJoinRequest: (requestId, reviewerId) => {
        set((s) => ({
          joinRequests: s.joinRequests.map((r) =>
            r.id === requestId
              ? { ...r, status: "rejected" as const, reviewedAt: new Date().toISOString(), reviewedBy: reviewerId }
              : r
          ),
        }));
      },

      getPendingRequests: (groupId) => {
        return get().joinRequests.filter((r) => r.groupId === groupId && r.status === "pending");
      },

      getUserRequestStatus: (groupId, userId) => {
        const requests = get().joinRequests.filter(
          (r) => r.groupId === groupId && r.userId === userId
        );
        if (requests.length === 0) return null;
        // Return the most recent request status
        const sorted = [...requests].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return sorted[0].status;
      },

      getPendingRequestCount: (groupId) => {
        return get().joinRequests.filter((r) => r.groupId === groupId && r.status === "pending").length;
      },
    }),
    {
      name: "hivemind-group-social",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : sessionStorage
      ),
    }
  )
);
