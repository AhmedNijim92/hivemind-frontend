"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Hand, ArrowLeft, Lock, Globe, Copy, Send,
  MessageCircle, Crown, ScreenShare, ScreenShareOff,
  Sparkles, Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useMeetingParticipants } from "@/hooks/use-meetings";
import { meetingService } from "@/services/meeting.service";
import { usePageTitle } from "@/hooks/use-page-title";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  name: string;
  text: string;
  time: string;
}

export default function MeetingRoomPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params);
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [meetingData, setMeetingData] = useState<any>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Media state
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const { data: participants } = useMeetingParticipants(meetingId);

  usePageTitle(meetingData?.title ?? "Live Room");

  // Load meeting
  useEffect(() => {
    async function findMeeting() {
      try {
        const stored = sessionStorage.getItem(`meeting-${meetingId}`);
        if (stored) {
          const { groupId: gId } = JSON.parse(stored);
          setGroupId(gId);
          const meeting = await meetingService.getMeeting(gId, meetingId);
          setMeetingData(meeting);
        } else {
          setError("Room not found. Return to meetings.");
        }
      } catch {
        setError("Unable to connect to room.");
      }
      setLoading(false);
    }
    findMeeting();
  }, [meetingId]);

  // Join backend
  useEffect(() => {
    if (!meetingData || !groupId || meetingData.status !== "ACTIVE") return;
    meetingService.joinMeeting(groupId, meetingId).catch(() => {});
  }, [meetingData, groupId, meetingId]);

  // Camera toggle
  const toggleVideo = useCallback(async () => {
    if (videoOn && localStream) {
      localStream.getVideoTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setVideoOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        setLocalStream(stream);
        setVideoOn(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {
        toast.error("Camera access denied");
      }
    }
  }, [videoOn, localStream, micOn]);

  // Mic toggle
  const toggleMic = useCallback(async () => {
    if (micOn && localStream) {
      localStream.getAudioTracks().forEach((t) => t.stop());
      if (!videoOn) {
        setLocalStream(null);
      }
      setMicOn(false);
    } else {
      try {
        if (localStream) {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach((t) => localStream.addTrack(t));
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(stream);
        }
        setMicOn(true);
      } catch {
        toast.error("Microphone access denied");
      }
    }
  }, [micOn, localStream, videoOn]);

  // Attach video to ref when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [localStream]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleLeave = async () => {
    localStream?.getTracks().forEach((t) => t.stop());
    try { await meetingService.leaveMeeting(meetingId); } catch {}
    router.push("/meetings");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      name: currentUser?.name ?? "You",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    setChatInput("");
  };

  // Status screens
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <p className="text-white/50 text-sm">Joining room…</p>
        </motion.div>
      </div>
    );
  }

  if (error || !meetingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center space-y-4 max-w-xs">
          <p className="text-4xl">🔇</p>
          <h1 className="text-lg font-bold text-white">{error ?? "Room unavailable"}</h1>
          <Button onClick={() => router.push("/meetings")} variant="ghost" className="text-white/50"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </div>
      </div>
    );
  }

  if (meetingData.status === "SCHEDULED") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center space-y-5 max-w-xs">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-brand-500/40">
              <Mic className="h-10 w-10 text-white" />
            </div>
          </motion.div>
          <h1 className="text-xl font-bold text-white">{meetingData.title}</h1>
          <p className="text-white/40 text-sm">The host hasn't opened this room yet.</p>
          <Button onClick={() => router.push("/meetings")} variant="ghost" className="text-white/40"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </div>
      </div>
    );
  }

  if (meetingData.status === "ENDED") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center space-y-4 max-w-xs">
          <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto"><PhoneOff className="h-8 w-8 text-white/30" /></div>
          <h1 className="text-lg font-bold text-white">Room closed</h1>
          <p className="text-white/40 text-sm">&quot;{meetingData.title}&quot; ended.</p>
          <Button onClick={() => router.push("/meetings")} variant="ghost" className="text-white/40"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </div>
      </div>
    );
  }

  // ─── ACTIVE ROOM ─────────────────────────────────────────────────────────────
  const isHost = meetingData.hostId === userId;
  const participantList = participants ?? [userId ?? ""];
  const participantCount = participantList.length;

  return (
    <div className="h-screen flex flex-col bg-[#09090b] select-none">
      {/* ── Header ──────────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.04] z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={handleLeave} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white truncate">{meetingData.title}</h1>
              <span className="flex items-center gap-1 text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md font-semibold tracking-wide flex-shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-[11px] text-white/30 flex items-center gap-1.5 mt-0.5">
              {meetingData.privacy === "PUBLIC" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {meetingData.privacy === "PUBLIC" ? "Open" : "Private"}
              <span className="text-white/15">·</span>
              <Users className="h-3 w-3" /> {participantCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`) && toast.success("Link copied")} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Copy link">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-lg transition-colors ${showChat ? "bg-brand-500/15 text-brand-400" : "hover:bg-white/5 text-white/40 hover:text-white"}`}>
            <MessageCircle className="h-4 w-4" />
            {chatMessages.length > 0 && !showChat && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand-500" />}
          </button>
        </div>
      </header>

      {/* ── Stage ───────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          {/* Video / Avatar grid */}
          <div className="flex-1 p-4 sm:p-8 flex items-center justify-center overflow-y-auto">
            <div className={`grid gap-4 w-full max-w-4xl ${participantCount <= 1 ? "grid-cols-1 max-w-md" : participantCount <= 4 ? "grid-cols-2" : "grid-cols-3"}`}>
              {participantList.map((pId, idx) => {
                const isSelf = pId === userId;
                const isParticipantHost = pId === meetingData.hostId;

                return (
                  <motion.div
                    key={pId}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.08, type: "spring", stiffness: 200 }}
                    className={`relative aspect-video rounded-2xl overflow-hidden ${isSelf && videoOn ? "" : "bg-gradient-to-br from-[#1a1a2e] to-[#16162a]"} border border-white/[0.04] shadow-xl`}
                  >
                    {/* Self video */}
                    {isSelf && videoOn ? (
                      <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <motion.div
                          animate={isSelf && micOn ? { boxShadow: ["0 0 0 0 rgba(139,92,246,0)", "0 0 0 12px rgba(139,92,246,0.15)", "0 0 0 0 rgba(139,92,246,0)"] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="rounded-full"
                        >
                          <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden ring-2 ${isParticipantHost ? "ring-yellow-400/50" : "ring-white/10"}`}>
                            <Avatar name={isSelf ? currentUser?.name : undefined} size="xl" className="h-full w-full text-2xl" />
                          </div>
                        </motion.div>
                        <span className="text-xs text-white/50 font-medium">
                          {isSelf ? (currentUser?.name ?? "You") : `Participant ${idx + 1}`}
                        </span>
                      </div>
                    )}

                    {/* Overlays */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[11px] text-white/70 font-medium bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                        {isParticipantHost && <Crown className="h-3 w-3 text-yellow-400" />}
                        {isSelf ? (currentUser?.name ?? "You") : `User ${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-1">
                        {isSelf && !micOn && (
                          <span className="h-5 w-5 rounded-full bg-red-500/80 flex items-center justify-center">
                            <MicOff className="h-3 w-3 text-white" />
                          </span>
                        )}
                        {handRaised && isSelf && (
                          <span className="text-sm">✋</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── Controls bar ────────────────────────────────────────────────────── */}
          <div className="px-4 py-3 bg-[#0f0f13]/80 backdrop-blur-xl border-t border-white/[0.04]">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <ControlButton active={micOn} danger={!micOn} onClick={toggleMic} label={micOn ? "Mute" : "Unmute"}>
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </ControlButton>

              <ControlButton active={videoOn} onClick={toggleVideo} label={videoOn ? "Stop video" : "Start video"}>
                {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </ControlButton>

              <ControlButton active={handRaised} highlight={handRaised} onClick={() => { setHandRaised(!handRaised); toast(handRaised ? "Hand lowered" : "✋ Hand raised"); }} label="Raise hand">
                <Hand className="h-5 w-5" />
              </ControlButton>

              <div className="w-px h-7 bg-white/10 mx-1 hidden sm:block" />

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLeave}
                className="h-11 px-5 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 font-medium text-sm transition-all shadow-lg shadow-red-500/20"
              >
                <PhoneOff className="h-4 w-4" /> Leave
              </motion.button>

              {isHost && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    if (groupId) {
                      localStream?.getTracks().forEach((t) => t.stop());
                      await meetingService.endMeeting(groupId, meetingId);
                      toast.success("Room ended");
                      router.push("/meetings");
                    }
                  }}
                  className="h-11 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-sm transition-all hidden sm:flex items-center gap-1.5"
                >
                  End for all
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* ── Chat panel ───────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showChat && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border-l border-white/[0.04] flex flex-col bg-[#0f0f13] overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Chat</h2>
                <span className="text-[10px] text-white/30">{chatMessages.length} messages</span>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <MessageCircle className="h-8 w-8 text-white/10" />
                    <p className="text-xs text-white/20">Messages appear here</p>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                    <Avatar name={msg.name} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] font-semibold text-white/70">{msg.name}</span>
                        <span className="text-[9px] text-white/20">{msg.time}</span>
                      </div>
                      <p className="text-[13px] text-white/50 break-words leading-relaxed">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="px-3 py-2.5 border-t border-white/[0.04] flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/40 transition-colors"
                />
                <button type="submit" disabled={!chatInput.trim()} className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:hover:bg-brand-500 text-white transition-all">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Control Button Component ──────────────────────────────────────────────────

function ControlButton({ active, danger, highlight, onClick, label, children }: {
  active?: boolean;
  danger?: boolean;
  highlight?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      title={label}
      className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
        danger ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" :
        highlight ? "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25" :
        active ? "bg-white/10 text-white hover:bg-white/15" :
        "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70"
      }`}
    >
      {children}
    </motion.button>
  );
}
