import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useGroupSocialStore } from "@/store/group-social-store";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";

/** Follow/unfollow a group */
export function useGroupFollow(groupId: string) {
  const userId = useAuthStore((s) => s.userId);
  const followers = useGroupSocialStore((s) => s.followers);
  const followGroup = useGroupSocialStore((s) => s.followGroup);
  const unfollowGroup = useGroupSocialStore((s) => s.unfollowGroup);
  const isFollowingGroup = useGroupSocialStore((s) => s.isFollowingGroup);
  const getGroupFollowerCount = useGroupSocialStore((s) => s.getGroupFollowerCount);

  const isFollowing = useMemo(
    () => userId ? isFollowingGroup(groupId, userId) : false,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupId, userId, followers]
  );

  const followerCount = useMemo(
    () => getGroupFollowerCount(groupId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupId, followers]
  );

  const toggle = useCallback(() => {
    if (!userId) { toast.error("Login required"); return; }
    if (isFollowing) {
      unfollowGroup(groupId, userId);
      toast.success("Unfollowed group");
    } else {
      followGroup(groupId, userId);
      toast.success("Following group!");
    }
  }, [userId, isFollowing, groupId, followGroup, unfollowGroup]);

  return { isFollowing, followerCount, toggle };
}

/** Join request management for private groups */
export function useJoinRequest(groupId: string) {
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const joinRequests = useGroupSocialStore((s) => s.joinRequests);
  const createJoinRequest = useGroupSocialStore((s) => s.createJoinRequest);
  const getUserRequestStatus = useGroupSocialStore((s) => s.getUserRequestStatus);

  const requestStatus = useMemo(
    () => userId ? getUserRequestStatus(groupId, userId) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupId, userId, joinRequests]
  );

  const sendRequest = useCallback(() => {
    if (!userId || !currentUser) { toast.error("Login required"); return; }
    createJoinRequest(groupId, userId, currentUser.name, currentUser.profilePictureUrl);
    toast.success("Join request sent! Waiting for admin approval.");
  }, [userId, currentUser, groupId, createJoinRequest]);

  return { requestStatus, sendRequest };
}

/** Admin: manage pending join requests */
export function usePendingRequests(groupId: string) {
  const joinRequests = useGroupSocialStore((s) => s.joinRequests);
  const getPendingRequests = useGroupSocialStore((s) => s.getPendingRequests);
  const approveJoinRequest = useGroupSocialStore((s) => s.approveJoinRequest);
  const rejectJoinRequest = useGroupSocialStore((s) => s.rejectJoinRequest);
  const getPendingRequestCount = useGroupSocialStore((s) => s.getPendingRequestCount);
  const userId = useAuthStore((s) => s.userId);

  const pendingRequests = useMemo(
    () => getPendingRequests(groupId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupId, joinRequests]
  );

  const pendingCount = useMemo(
    () => getPendingRequestCount(groupId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupId, joinRequests]
  );

  const approve = useCallback((requestId: string) => {
    if (!userId) return;
    approveJoinRequest(requestId, userId);
    toast.success("Request approved!");
  }, [userId, approveJoinRequest]);

  const reject = useCallback((requestId: string) => {
    if (!userId) return;
    rejectJoinRequest(requestId, userId);
    toast.success("Request rejected");
  }, [userId, rejectJoinRequest]);

  return { pendingRequests, pendingCount, approve, reject };
}
