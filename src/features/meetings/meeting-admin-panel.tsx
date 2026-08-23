"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Video, UserX, Ban, Check, Crown, Hand, Shield, Volume2, VolumeX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import toast from "react-hot-toast";

interface RoomState {
  speakers: string[];
  raisedHands: { userId: string; name: string }[];
  muted: string[];
  blocked: string[];
}

interface MeetingAdminPanelProps {
  meetingId: string;
  open: boolean;
  onClose: () => void;
  participants: string[];
  isHost: boolean;
}

export function MeetingAdminPanel({ meetingId, open, onClose, participants, isHost }: MeetingAdminPanelProps) {
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const [roomState, setRoomState] = useState<RoomState>({ speakers: [], raisedHands: [], muted: [], blocked: [] });
  const [tab, setTab] = useState<"participants" | "hands">("participants");

  // Poll room state every 3 seconds
  useEffect(() => {
    if (!open || !isHost) return;
    const fetch = () => {
      apiClient.get(`/api/v1/meetings/${meetingId}/admin/state`)
        .then((res) => setRoomState(res.data))
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, [open, meetingId, isHost]);

  const approveSpeaker = async (targetUserId: string) => {
    await apiClient.post(`/api/v1/meetings/${meetingId}/speakers/${targetUserId}`);
    toast.success("Speaker approved");
    setRoomState((s) => ({
      ...s,
      speakers: [...s.speakers, targetUserId],
      raisedHands: s.raisedHands.filter((h) => h.userId !== targetUserId),
    }));
  };

  const removeSpeaker = async (targetUserId: string) => {
    await apiClient.delete(`/api/v1/meetings/${meetingId}/speakers/${targetUserId}`);
    toast("Speaker permission removed");
    setRoomState((s) => ({ ...s, speakers: s.speakers.filter((id) => id !== targetUserId) }));
  };

  const muteUser = async (targetUserId: string) => {
    await apiClient.post(`/api/v1/meetings/${meetingId}/mute/${targetUserId}`);
    toast("Participant muted");
    setRoomState((s) => ({ ...s, muted: [...s.muted, targetUserId] }));
  };

  const unmuteUser = async (targetUserId: string) => {
    await apiClient.delete(`/api/v1/meetings/${meetingId}/mute/${targetUserId}`);
    toast("Participant unmuted");
    setRoomState((s) => ({ ...s, muted: s.muted.filter((id) => id !== targetUserId) }));
  };

  const kickUser = async (targetUserId: string) => {
    await apiClient.post(`/api/v1/meetings/${meetingId}/kick/${targetUserId}`);
    toast.success("Participant kicked");
  };

  const blockUser = async (targetUserId: string) => {
    await apiClient.post(`/api/v1/meetings/${meetingId}/block/${targetUserId}`);
    toast.success("Participant blocked");
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute right-0 top-0 bottom-0 z-40 w-80 bg-black/70 backdrop-blur-2xl border-l border-white/[0.06] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white">Admin Panel</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-3 pt-3 gap-1">
        <button
          onClick={() => setTab("participants")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === "participants" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
        >
          Participants ({participants.length})
        </button>
        <button
          onClick={() => setTab("hands")}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all relative ${tab === "hands" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
        >
          Raised Hands
          {roomState.raisedHands.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 text-[9px] font-bold flex items-center justify-center text-black">
              {roomState.raisedHands.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {tab === "hands" && (
          <>
            {roomState.raisedHands.length === 0 ? (
              <div className="text-center py-8">
                <Hand className="h-8 w-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/30">No raised hands</p>
              </div>
            ) : (
              roomState.raisedHands.map((hand) => (
                <motion.div
                  key={hand.userId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
                >
                  <Avatar name={hand.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{hand.name}</p>
                    <p className="text-[10px] text-yellow-400">Wants to speak</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => approveSpeaker(hand.userId)}
                      className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                      title="Approve to speak"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { apiClient.delete(`/api/v1/meetings/${meetingId}/raise-hand`, { headers: { "X-User-Id": hand.userId } }).catch(() => {}); setRoomState((s) => ({ ...s, raisedHands: s.raisedHands.filter((h) => h.userId !== hand.userId) })); }}
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </>
        )}

        {tab === "participants" && (
          <>
            {participants.map((pId) => {
              const isSelf = pId === userId;
              const isSpeaker = roomState.speakers.includes(pId);
              const isMuted = roomState.muted.includes(pId);
              const isHostUser = pId === userId && isHost;
              return (
                <div key={pId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all">
                  <Avatar name={isSelf ? currentUser?.name : pId.slice(0, 8)} src={isSelf ? currentUser?.profilePictureUrl : undefined} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate flex items-center gap-1">
                      {isSelf ? (currentUser?.name ?? "You") : pId.slice(0, 8)}
                      {isHostUser && <Crown className="h-3 w-3 text-yellow-400" />}
                      {isSpeaker && <Mic className="h-3 w-3 text-green-400" />}
                    </p>
                    <p className="text-[10px] text-white/30">
                      {isSpeaker ? "Speaker" : "Listener"}{isMuted ? " · Muted" : ""}
                    </p>
                  </div>
                  {/* Admin actions (don't show for self) */}
                  {!isSelf && isHost && (
                    <div className="flex items-center gap-0.5">
                      {isSpeaker ? (
                        <button onClick={() => removeSpeaker(pId)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Remove speaker">
                          <MicOff className="h-3 w-3" />
                        </button>
                      ) : (
                        <button onClick={() => approveSpeaker(pId)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-all" title="Allow to speak">
                          <Mic className="h-3 w-3" />
                        </button>
                      )}
                      {isMuted ? (
                        <button onClick={() => unmuteUser(pId)} className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 transition-all" title="Unmute">
                          <Volume2 className="h-3 w-3" />
                        </button>
                      ) : (
                        <button onClick={() => muteUser(pId)} className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 transition-all" title="Mute">
                          <VolumeX className="h-3 w-3" />
                        </button>
                      )}
                      <button onClick={() => kickUser(pId)} className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-500/10 transition-all" title="Kick">
                        <UserX className="h-3 w-3" />
                      </button>
                      <button onClick={() => blockUser(pId)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all" title="Block">
                        <Ban className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </motion.div>
  );
}
