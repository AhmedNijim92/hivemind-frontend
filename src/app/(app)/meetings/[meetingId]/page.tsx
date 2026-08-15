"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Hand, ArrowLeft, Lock, Globe, Copy, Send,
  MessageCircle, Crown, Heart, Flame, ThumbsUp, Laugh,
  Sparkles, Zap, Monitor, Grid, Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useMeetingParticipants } from "@/hooks/use-meetings";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { useHaptic } from "@/hooks/use-haptic";
import { meetingService } from "@/services/meeting.service";
import { usePageTitle } from "@/hooks/use-page-title";
import toast from "react-hot-toast";

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

const REACTIONS = [
  { emoji: "❤️", icon: Heart, color: "text-red-400" },
  { emoji: "🔥", icon: Flame, color: "text-orange-400" },
  { emoji: "👍", icon: ThumbsUp, color: "text-blue-400" },
  { emoji: "😂", icon: Laugh, color: "text-yellow-400" },
  { emoji: "✨", icon: Sparkles, color: "text-purple-400" },
  { emoji: "⚡", icon: Zap, color: "text-cyan-400" },
];

type ViewMode = "grid" | "speaker";

export default function MeetingRoomPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params);
  const router = useRouter();
  const haptic = useHaptic();
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [meetingData, setMeetingData] = useState<any>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Media
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  // UI
  const [showChat, setShowChat] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: participants } = useMeetingParticipants(meetingId);
  const chatConversationId = `meeting_${meetingId}`;
  const chatMessages = useMessages(chatConversationId);
  const sendChatMsg = useSendMessage();
  usePageTitle(meetingData?.title ?? "Live Room");

  // ─── Load meeting ────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem(`meeting-${meetingId}`);
    if (!stored) { setError("Room not found. Return to meetings."); setLoading(false); return; }
    const { groupId: gId } = JSON.parse(stored);
    setGroupId(gId);
    meetingService.getMeeting(gId, meetingId)
      .then((m) => setMeetingData(m))
      .catch(() => setError("Unable to connect."))
      .finally(() => setLoading(false));
  }, [meetingId]);

  // ─── Join backend ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!meetingData || !groupId || meetingData.status !== "ACTIVE") return;
    meetingService.joinMeeting(groupId, meetingId).catch(() => {});
  }, [meetingData, groupId, meetingId]);

  // ─── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: micOn,
      });
      setMediaStream(stream);
      setVideoOn(true);
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      toast.error("Could not access camera. Check browser permissions.");
    }
  }, [micOn]);

  const stopCamera = useCallback(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => t.stop());
      if (!micOn) {
        mediaStream.getAudioTracks().forEach((t) => t.stop());
        setMediaStream(null);
      }
    }
    setVideoOn(false);
  }, [mediaStream, micOn]);

  const toggleVideo = useCallback(() => {
    haptic.tap();
    if (videoOn) stopCamera();
    else startCamera();
  }, [videoOn, startCamera, stopCamera, haptic]);

  // ─── Microphone ──────────────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    haptic.tap();
    if (micOn) {
      mediaStream?.getAudioTracks().forEach((t) => t.stop());
      setMicOn(false);
    } else {
      try {
        if (mediaStream) {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach((t) => mediaStream.addTrack(t));
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMediaStream(stream);
        }
        setMicOn(true);
      } catch {
        toast.error("Microphone access denied");
      }
    }
  }, [micOn, mediaStream, haptic]);

  // ─── Screen Share ────────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(() => {
    haptic.tap();
    setScreenSharing((prev) => !prev);
    if (!screenSharing) {
      toast.success("Screen sharing started");
    } else {
      toast("Screen sharing stopped");
    }
  }, [screenSharing, haptic]);

  // ─── Sync video ref ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && mediaStream && videoOn) {
      localVideoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, videoOn]);

  // ─── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { mediaStream?.getTracks().forEach((t) => t.stop()); };
  }, [mediaStream]);

  // ─── Chat ────────────────────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    haptic.tap();
    sendChatMsg(chatConversationId, currentUser?.name ?? "User", chatInput.trim());
    setChatInput("");
  };

  // ─── Reactions (TikTok-style floating) ───────────────────────────────────────
  const sendReaction = (emoji: string) => {
    haptic.tap();
    const reaction: FloatingReaction = {
      id: crypto.randomUUID(),
      emoji,
      x: 20 + Math.random() * 60,
    };
    setFloatingReactions((prev) => [...prev, reaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 3000);
  };

  // ─── Leave ───────────────────────────────────────────────────────────────────
  const handleLeave = async () => {
    haptic.heavy();
    mediaStream?.getTracks().forEach((t) => t.stop());
    try { await meetingService.leaveMeeting(meetingId); } catch {}
    router.push("/meetings");
  };

  // ─── Status screens ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || !meetingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center space-y-4">
          <p className="text-4xl">🔇</p>
          <h1 className="text-lg font-bold text-white">{error}</h1>
          <button onClick={() => router.push("/meetings")} className="text-sm text-white/40 hover:text-white/70 flex items-center gap-1 mx-auto"><ArrowLeft className="h-4 w-4" /> Back</button>
        </div>
      </div>
    );
  }

  if (meetingData.status === "SCHEDULED") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center space-y-5">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-brand-500/30">
              <Mic className="h-12 w-12 text-white" />
            </div>
          </motion.div>
          <h1 className="text-xl font-bold text-white">{meetingData.title}</h1>
          <p className="text-white/40 text-sm">Waiting for host to open…</p>
          <button onClick={() => router.push("/meetings")} className="text-sm text-white/30 hover:text-white/60 flex items-center gap-1 mx-auto"><ArrowLeft className="h-4 w-4" /> Back</button>
        </div>
      </div>
    );
  }

  if (meetingData.status === "ENDED") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto"><PhoneOff className="h-8 w-8 text-white/20" /></div>
          <h1 className="text-lg font-bold text-white">Room closed</h1>
          <button onClick={() => router.push("/meetings")} className="text-sm text-white/30 hover:text-white/60 flex items-center gap-1 mx-auto"><ArrowLeft className="h-4 w-4" /> Back</button>
        </div>
      </div>
    );
  }

  // ─── ACTIVE ROOM ─────────────────────────────────────────────────────────────
  const isHost = meetingData.hostId === userId;
  const participantList = participants ?? [userId ?? ""];
  const count = participantList.length;

  // Grid layout classes based on view mode
  const getGridClasses = () => {
    if (viewMode === "speaker") return "grid-cols-1";
    if (count <= 1) return "grid-cols-1";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-3";
  };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] select-none overflow-hidden">
      {/* Floating reactions (TikTok-style) */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 1, y: "100vh", scale: 0.5 }}
              animate={{ opacity: [1, 1, 0], y: "-20vh", scale: [0.5, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute text-3xl"
              style={{ left: `${r.x}%` }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.03] z-20 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button onClick={handleLeave} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[13px] font-semibold text-white truncate">{meetingData.title}</h1>
              <span className="flex items-center gap-1 text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-bold tracking-wider flex-shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-[10px] text-white/25 flex items-center gap-1.5">
              {meetingData.privacy === "PUBLIC" ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
              {meetingData.privacy === "PUBLIC" ? "Open" : "Private"}
              <span>·</span>
              <Users className="h-2.5 w-2.5" /> {count}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* View toggle */}
          <button
            onClick={() => { haptic.selection(); setViewMode(viewMode === "grid" ? "speaker" : "grid"); }}
            className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"
            aria-label={viewMode === "grid" ? "Speaker view" : "Grid view"}
            title={viewMode === "grid" ? "Speaker view" : "Grid view"}
          >
            {viewMode === "grid" ? <Maximize2 className="h-3.5 w-3.5" /> : <Grid className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`); toast.success("Link copied"); }} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`relative p-2 rounded-lg transition-colors ${showChat ? "bg-brand-500/10 text-brand-400" : "hover:bg-white/5 text-white/30 hover:text-white"}`}>
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Stage */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-3 sm:p-5 flex items-center justify-center min-h-0 relative">
            {/* Screen share placeholder */}
            <AnimatePresence>
              {screenSharing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-3 sm:inset-5 z-10 rounded-2xl bg-[#0e0e14] border border-white/[0.06] flex flex-col items-center justify-center gap-3"
                >
                  <div className="h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                    <Monitor className="h-8 w-8 text-brand-400" />
                  </div>
                  <p className="text-sm text-white/60 font-medium">You are sharing your screen</p>
                  <p className="text-xs text-white/25">Others can see your screen content</p>
                  <button
                    onClick={toggleScreenShare}
                    className="mt-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Stop Sharing
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`grid gap-2 sm:gap-3 w-full h-full max-w-5xl ${getGridClasses()} auto-rows-fr`}>
              {participantList.map((pId, idx) => {
                const isSelf = pId === userId;
                const isPHost = pId === meetingData.hostId;
                const participantName = isSelf
                  ? (currentUser?.name ?? "You")
                  : `User ${idx + 1}`;

                // In speaker view, only show the "speaker" (first participant) large
                if (viewMode === "speaker" && idx > 0) return null;

                return (
                  <motion.div
                    key={pId}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                    className="relative rounded-2xl overflow-hidden bg-[#13131a] border border-white/[0.03]"
                  >
                    {isSelf && videoOn ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#18182a] to-[#0e0e14]">
                        <motion.div
                          animate={isSelf && micOn ? { boxShadow: ["0 0 0 0 rgba(168,85,247,0)", "0 0 0 16px rgba(168,85,247,0.1)", "0 0 0 0 rgba(168,85,247,0)"] } : {}}
                          transition={{ duration: 1.8, repeat: Infinity }}
                          className="rounded-full"
                        >
                          <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full ring-2 ${isPHost ? "ring-yellow-400/50" : "ring-white/[0.06]"} overflow-hidden`}>
                            <Avatar name={isSelf ? currentUser?.name : undefined} src={isSelf ? currentUser?.profilePictureUrl : undefined} size="xl" className="h-full w-full text-xl" />
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Participant name label overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/80 font-medium flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          {isPHost && <Crown className="h-3 w-3 text-yellow-400" />}
                          {participantName}
                        </span>
                        <div className="flex items-center gap-1">
                          {isSelf && !micOn && <span className="h-5 w-5 rounded-full bg-red-500/80 flex items-center justify-center"><MicOff className="h-2.5 w-2.5 text-white" /></span>}
                          {handRaised && isSelf && <span className="text-base animate-bounce">✋</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Speaker view thumbnail strip */}
          <AnimatePresence>
            {viewMode === "speaker" && count > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide"
              >
                {participantList.slice(1).map((pId, idx) => {
                  const isSelf = pId === userId;
                  const isPHost = pId === meetingData.hostId;
                  return (
                    <div key={pId} className="relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-[#13131a] border border-white/[0.05]">
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#18182a] to-[#0e0e14]">
                        <Avatar name={isSelf ? currentUser?.name : undefined} size="sm" className="h-8 w-8" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 bg-black/50">
                        <span className="text-[9px] text-white/60 font-medium flex items-center gap-0.5">
                          {isPHost && <Crown className="h-2 w-2 text-yellow-400" />}
                          {isSelf ? "You" : `User ${idx + 2}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="px-4 py-3 flex-shrink-0 border-t border-white/[0.03]">
            <div className="flex items-center justify-center gap-2">
              {/* Mic */}
              <CtrlBtn active={micOn} danger={!micOn} onClick={toggleMic}>
                {micOn ? <Mic className="h-[18px] w-[18px]" /> : <MicOff className="h-[18px] w-[18px]" />}
              </CtrlBtn>
              {/* Video */}
              <CtrlBtn active={videoOn} onClick={toggleVideo}>
                {videoOn ? <Video className="h-[18px] w-[18px]" /> : <VideoOff className="h-[18px] w-[18px]" />}
              </CtrlBtn>
              {/* Screen Share */}
              <CtrlBtn active={screenSharing} highlight={screenSharing} onClick={toggleScreenShare}>
                <Monitor className="h-[18px] w-[18px]" />
              </CtrlBtn>
              {/* Hand */}
              <CtrlBtn active={handRaised} highlight={handRaised} onClick={() => { haptic.tap(); setHandRaised(!handRaised); toast(handRaised ? "Hand lowered" : "✋ Raised"); }}>
                <Hand className="h-[18px] w-[18px]" />
              </CtrlBtn>

              {/* Reactions */}
              <div className="relative">
                <CtrlBtn active={showReactions} highlight={showReactions} onClick={() => setShowReactions(!showReactions)}>
                  <Heart className="h-[18px] w-[18px]" />
                </CtrlBtn>
                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#1a1a24] border border-white/[0.06] rounded-2xl px-2 py-1.5 flex gap-1 shadow-xl"
                    >
                      {REACTIONS.map((r) => (
                        <motion.button
                          key={r.emoji}
                          whileTap={{ scale: 1.4 }}
                          onClick={() => { sendReaction(r.emoji); setShowReactions(false); }}
                          className="h-9 w-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-lg transition-colors"
                        >
                          {r.emoji}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-6 bg-white/[0.06] mx-1" />

              {/* Leave */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleLeave} className="h-10 px-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 text-[13px] font-medium transition-all shadow-lg shadow-red-500/20">
                <PhoneOff className="h-4 w-4" /> Leave
              </motion.button>

              {isHost && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={async () => {
                  if (!groupId) return;
                  haptic.heavy();
                  mediaStream?.getTracks().forEach((t) => t.stop());
                  await meetingService.endMeeting(groupId, meetingId);
                  toast.success("Room ended");
                  router.push("/meetings");
                }} className="h-10 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white text-[12px] transition-all hidden sm:flex items-center">
                  End
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Chat */}
        <AnimatePresence>
          {showChat && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="border-l border-white/[0.03] flex flex-col bg-[#0c0c10] overflow-hidden flex-shrink-0"
            >
              <div className="px-4 py-2.5 border-b border-white/[0.03]">
                <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Live Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 min-h-0">
                {chatMessages.length === 0 && (
                  <p className="text-[11px] text-white/15 text-center mt-10">No messages yet</p>
                )}
                {chatMessages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                    <Avatar name={msg.senderName} src={msg.senderId === userId ? currentUser?.profilePictureUrl ?? undefined : undefined} size="xs" />
                    <div>
                      <span className="text-[10px] font-semibold text-white/50">{msg.senderName} <span className="text-white/15 font-normal">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></span>
                      <p className="text-[12px] text-white/40 leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="px-2.5 py-2 border-t border-white/[0.03] flex gap-1.5">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Say something…" className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-1.5 text-[12px] text-white placeholder-white/15 focus:outline-none focus:border-brand-500/30" />
                <button type="submit" disabled={!chatInput.trim()} className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-20 text-white transition-all">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Control Button ────────────────────────────────────────────────────────────
function CtrlBtn({ active, danger, highlight, onClick, children }: {
  active?: boolean; danger?: boolean; highlight?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <motion.button whileTap={{ scale: 0.85 }} onClick={onClick}
      className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${
        danger ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" :
        highlight ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" :
        active ? "bg-white/10 text-white hover:bg-white/15" :
        "bg-white/[0.03] text-white/30 hover:bg-white/[0.06] hover:text-white/60"
      }`}
    >{children}</motion.button>
  );
}
