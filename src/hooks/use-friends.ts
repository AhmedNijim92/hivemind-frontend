import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useFriendStore } from "@/store/friend-store";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";

/** Check friendship status and manage friend requests with a specific user */
export function useFriendship(targetUserId: string) {
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const friendships = useFriendStore((s) => s.friendships);
  const requests = useFriendStore((s) => s.requests);
  const areFriends = useFriendStore((s) => s.areFriends);
  const getRequestStatus = useFriendStore((s) => s.getRequestStatus);
  const sendRequest = useFriendStore((s) => s.sendRequest);
  const removeFriend = useFriendStore((s) => s.removeFriend);

  const isFriend = useMemo(
    () => userId ? areFriends(userId, targetUserId) : false,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, targetUserId, friendships]
  );

  const requestStatus = useMemo(
    () => userId ? getRequestStatus(userId, targetUserId) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, targetUserId, requests]
  );

  // Did I send the pending request, or did they?
  const pendingRequest = useMemo(() => {
    if (!userId) return null;
    return requests.find(
      (r) =>
        r.status === "pending" &&
        ((r.fromUserId === userId && r.toUserId === targetUserId) ||
          (r.fromUserId === targetUserId && r.toUserId === userId))
    );
  }, [userId, targetUserId, requests]);

  const iSentRequest = pendingRequest?.fromUserId === userId;
  const theySentRequest = pendingRequest?.fromUserId === targetUserId;

  const sendFriendRequest = useCallback(
    (targetName: string, targetAvatar: string | null) => {
      if (!userId || !currentUser) { toast.error("Login required"); return; }
      sendRequest(
        { id: userId, name: currentUser.name, avatar: currentUser.profilePictureUrl },
        { id: targetUserId, name: targetName, avatar: targetAvatar }
      );
      toast.success("Friend request sent!");
    },
    [userId, currentUser, targetUserId, sendRequest]
  );

  const unfriend = useCallback(() => {
    if (!userId) return;
    removeFriend(userId, targetUserId);
    toast.success("Removed from friends");
  }, [userId, targetUserId, removeFriend]);

  return {
    isFriend,
    requestStatus,
    pendingRequest,
    iSentRequest,
    theySentRequest,
    sendFriendRequest,
    unfriend,
  };
}

/** Get friend count and list for a user */
export function useFriendList(userId: string) {
  const friendships = useFriendStore((s) => s.friendships);
  const getFriends = useFriendStore((s) => s.getFriends);
  const getFriendCount = useFriendStore((s) => s.getFriendCount);

  const friends = useMemo(
    () => getFriends(userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, friendships]
  );

  const count = useMemo(
    () => getFriendCount(userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, friendships]
  );

  return { friends, count };
}

/** Get pending friend requests for the current user */
export function usePendingFriendRequests() {
  const userId = useAuthStore((s) => s.userId);
  const requests = useFriendStore((s) => s.requests);
  const getPendingRequestsForUser = useFriendStore((s) => s.getPendingRequestsForUser);
  const getPendingRequestCount = useFriendStore((s) => s.getPendingRequestCount);
  const acceptRequest = useFriendStore((s) => s.acceptRequest);
  const rejectRequest = useFriendStore((s) => s.rejectRequest);

  const pending = useMemo(
    () => userId ? getPendingRequestsForUser(userId) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, requests]
  );

  const count = useMemo(
    () => userId ? getPendingRequestCount(userId) : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, requests]
  );

  const accept = useCallback((requestId: string) => {
    acceptRequest(requestId);
    toast.success("Friend request accepted!");
  }, [acceptRequest]);

  const reject = useCallback((requestId: string) => {
    rejectRequest(requestId);
    toast.success("Request declined");
  }, [rejectRequest]);

  return { pending, count, accept, reject };
}
