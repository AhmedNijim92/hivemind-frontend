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

  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  const [showChat, setShowChat] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: participants } = useMeetingParticipants(meetingId);
  const chatConversationId = `meeting_${meetingId}`;
  const chatMessages = useMessages(chatConversationId);
  const sendChatMsg = useSendMessage();
  usePageTitle(meetingData?.title ?? "Live Room");

  // ─── Load meeting ──────────────────────────────────────────────────────
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

  useEffect(() => {
    if (!meetingData || !groupId || meetingData.status !== "ACTIVE") return;
    meetingService.joinMeeting(groupId, meetingId).catch(() => {});
  }, [meetingData, groupId, meetingId]);

  // ─── Camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: micOn });
      setMediaStream(stream);
      setVideoOn(true);
      setTimeout(() => { if (localVideoRef.current) localVideoRef.current.srcObject = stream; }, 50);
    } catch { toast.error("Could not access camera."); }
  }, [micOn]);

  const stopCamera = useCallback(() => {
    if (mediaStream) { mediaStream.getVideoTracks().forEach((t) => t.stop()); if (!micOn) { mediaStream.getAudioTracks().forEach((t) => t.stop()); setMediaStream(null); } }
    setVideoOn(false);
  }, [mediaStream, micOn]);

  const toggleVideo = useCallback(() => { haptic.tap(); if (videoOn) stopCamera(); else startCamera(); }, [videoOn, startCamera, stopCamera, haptic]);

  const toggleMic = useCallback(async () => {
    haptic.tap();
    if (micOn) { mediaStream?.getAudioTracks().forEach((t) => t.stop()); setMicOn(false); }
    else {
      try {
        if (mediaStream) { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getAudioTracks().forEach((t) => mediaStream.addTrack(t)); }
        else { setMediaStream(await navigator.mediaDevices.getUserMedia({ audio: true })); }
        setMicOn(true);
      } catch { toast.error("Microphone access denied"); }
    }
  }, [micOn, mediaStream, haptic]);

  const toggleScreenShare = useCallback(() => { haptic.tap(); setScreenSharing((p) => !p); toast(screenSharing ? "Screen sharing stopped" : "Screen sharing started"); }, [screenSharing, haptic]);

  useEffect(() => { if (localVideoRef.current && mediaStream && videoOn) localVideoRef.current.srcObject = mediaStream; }, [mediaStream, videoOn]);
  useEffect(() => { return () => { mediaStream?.getTracks().forEach((t) => t.stop()); }; }, [mediaStream]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleSendChat = () => { if (!chatInput.trim()) return; haptic.tap(); sendChatMsg(chatConversationId, currentUser?.name ?? "User", chatInput.trim()); setChatInput(""); };

  const sendReaction = (emoji: string) => {
    haptic.tap();
    const r: FloatingReaction = { id: crypto.randomUUID(), emoji, x: 10 + Math.random() * 80 };
    setFloatingReactions((prev) => [...prev, r]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((x) => x.id !== r.id)), 3500);
  };

  const handleLeave = async () => { haptic.heavy(); mediaStream?.getTracks().forEach((t) => t.stop()); try { await meetingService.leaveMeeting(meetingId); } catch {} router.push("/meetings"); };

  // ─── Status screens ────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]">
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-brand-500/30"><Sparkles className="h-8 w-8 text-white" /></div>
      </motion.div>
    </div>
  );

  if (error || !meetingData) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]">
      <div className="text-center space-y-4"><p className="text-5xl">🔇</p><h1 className="text-lg font-bold text-white">{error}</h1><button onClick={() => router.push("/meetings")} className="text-sm text-white/40 hover:text-white/70 flex items-center gap-1 mx-auto"><ArrowLeft className="h-4 w-4" /> Back</button></div>
    </div>
  );

  if (meetingData.status === "SCHEDULED") return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]">
      <div className="text-center space-y-5">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}><div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-brand-500/40"><Mic className="h-12 w-12 text-white" /></div></motion.div>
        <h1 className="text-xl font-bold text-white">{meetingData.title}</h1><p className="text-white/40 text-sm">Waiting for host…</p>
        <button onClick={() => router.push("/meetings")} className="text-sm text-white/30 hover:text-white/60 flex items-center gap-1 mx-auto"><ArrowLeft className="h-4 w-4" /> Back</button>
      </div>
    </div>
  );

  if (meetingData.status === "ENDED") return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]">
      <div className="text-center space-y-4"><div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto"><PhoneOff className="h-8 w-8 text-white/20" /></div><h1 className="text-lg font-bold text-white">Room closed</h1><button onClick={() => router.push("/meetings")} className="text-sm text-white/30 hover:text-white/60 flex items-center gap-1 mx-auto"><ArrowLeft className="h-4 w-4" /> Back</button></div>
    </div>
  );

  // ─── ACTIVE ROOM ───────────────────────────────────────────────────────
  const isHost = meetingData.hostId === userId;
  const participantList = participants ?? [userId ?? ""];
  const count = participantList.length;
  const getGridClasses = () => { if (viewMode === "speaker" || count <= 1) return "grid-cols-1"; if (count <= 4) return "grid-cols-2"; return "grid-cols-3"; };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#0e0e1a] to-[#0a0a12] select-none overflow-hidden">
      {/* Floating reactions */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 1, y: "85vh", scale: 0.6, rotate: -10 }} animate={{ opacity: [1, 1, 0], y: "-10vh", scale: [0.6, 1.5, 1.2], rotate: [−10, 10, -5] }} exit={{ opacity: 0 }} transition={{ duration: 3, ease: "easeOut" }} className="absolute text-4xl drop-shadow-lg" style={{ left: `${r.x}%` }}>
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-black/20 backdrop-blur-2xl border-b border-white/[0.04] z-20 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={handleLeave} className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all"><ArrowLeft className="h-4 w-4" /></button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold text-white truncate">{meetingData.title}</h1>
              <span className="flex items-center gap-1.5 text-[10px] bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 px-2 py-0.5 rounded-full font-semibold border border-red-500/20">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-[11px] text-white/30 flex items-center gap-2 mt-0.5">
              {meetingData.privacy === "PUBLIC" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {meetingData.privacy === "PUBLIC" ? "Open" : "Private"}
              <span className="text-white/10">•</span>
              <Users className="h-3 w-3" /> {count} in room
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { haptic.selection(); setViewMode(viewMode === "grid" ? "speaker" : "grid"); }} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all" title={viewMode === "grid" ? "Speaker view" : "Grid view"}>
            {viewMode === "grid" ? <Maximize2 className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </button>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`); toast.success("Link copied"); }} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all"><Copy className="h-4 w-4" /></button>
          <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-xl transition-all ${showChat ? "bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30" : "hover:bg-white/5 text-white/30 hover:text-white"}`}><MessageCircle className="h-4 w-4" /></button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Stage */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4 sm:p-6 flex items-center justify-center min-h-0 relative">
            {screenSharing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-4 sm:inset-6 z-10 rounded-3xl bg-gradient-to-br from-[#12122a] to-[#0a0a14] border border-white/[0.06] flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center border border-brand-500/20"><Monitor className="h-10 w-10 text-brand-400" /></div>
                <p className="text-sm text-white/70 font-medium">Sharing your screen</p>
                <button onClick={toggleScreenShare} className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all border border-red-500/20">Stop Sharing</button>
              </motion.div>
            )}

            <div className={`grid gap-3 sm:gap-4 w-full h-full max-w-5xl ${getGridClasses()} auto-rows-fr`}>
              {participantList.map((pId, idx) => {
                const isSelf = pId === userId;
                const isPHost = pId === meetingData.hostId;
                const name = isSelf ? (currentUser?.name ?? "You") : `User ${idx + 1}`;
                if (viewMode === "speaker" && idx > 0) return null;
                return (
                  <motion.div key={pId} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.08, type: "spring", stiffness: 250, damping: 25 }}
                    className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#14142a] to-[#0a0a14] border border-white/[0.04] shadow-2xl shadow-black/50 group/tile"
                  >
                    {isSelf && videoOn ? (
                      <video ref={localVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Animated background orbs */}
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl animate-pulse" />
                          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
                        </div>
                        <motion.div animate={isSelf && micOn ? { boxShadow: ["0 0 0 0 rgba(168,85,247,0)", "0 0 0 20px rgba(168,85,247,0.08)", "0 0 0 0 rgba(168,85,247,0)"] } : {}} transition={{ duration: 2, repeat: Infinity }} className="rounded-full relative z-10">
                          <div className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-[3px] ${isPHost ? "ring-yellow-400/60" : "ring-white/[0.08]"} overflow-hidden shadow-xl`}>
                            <Avatar name={isSelf ? currentUser?.name : undefined} src={isSelf ? currentUser?.profilePictureUrl : undefined} size="xl" className="h-full w-full text-2xl" />
                          </div>
                        </motion.div>
                      </div>
                    )}
                    {/* Name overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/90 font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.06]">
                          {isPHost && <Crown className="h-3 w-3 text-yellow-400" />}{name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isSelf && !micOn && <span className="h-6 w-6 rounded-lg bg-red-500/80 flex items-center justify-center backdrop-blur-sm"><MicOff className="h-3 w-3 text-white" /></span>}
                          {handRaised && isSelf && <span className="text-lg">✋</span>}
                        </div>
                      </div>
                    </div>
                    {/* Always-visible name for non-hover */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[11px] text-white/60 font-medium flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-md">
                        {isPHost && <Crown className="h-2.5 w-2.5 text-yellow-400" />}{name}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="px-4 py-4 flex-shrink-0">
            <div className="flex items-center justify-center gap-2.5">
              <CtrlBtn active={micOn} danger={!micOn} onClick={toggleMic} label={micOn ? "Mute" : "Unmute"}>
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </CtrlBtn>
              <CtrlBtn active={videoOn} onClick={toggleVideo} label={videoOn ? "Stop video" : "Start video"}>
                {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </CtrlBtn>
              <CtrlBtn active={screenSharing} highlight={screenSharing} onClick={toggleScreenShare} label="Share screen">
                <Monitor className="h-5 w-5" />
              </CtrlBtn>
              <CtrlBtn active={handRaised} highlight={handRaised} onClick={() => { haptic.tap(); setHandRaised(!handRaised); toast(handRaised ? "Hand lowered" : "✋ Raised"); }} label="Raise hand">
                <Hand className="h-5 w-5" />
              </CtrlBtn>

              {/* Reaction button */}
              <div className="relative">
                <CtrlBtn active={showReactions} highlight={showReactions} onClick={() => setShowReactions(!showReactions)} label="React">
                  <Heart className="h-5 w-5" />
                </CtrlBtn>
                <AnimatePresence>
                  {showReactions && (
                    <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#1c1c2e]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-3 py-2 flex gap-1.5 shadow-2xl shadow-black/50"
                    >
                      {REACTIONS.map((r) => (
                        <motion.button key={r.emoji} whileHover={{ scale: 1.3, y: -4 }} whileTap={{ scale: 1.6 }} onClick={() => { sendReaction(r.emoji); setShowReactions(false); }}
                          className="h-10 w-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-all"
                        >{r.emoji}</motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2" />

              <motion.button whileTap={{ scale: 0.9 }} onClick={handleLeave}
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center gap-2 text-sm font-semibold transition-all shadow-xl shadow-red-500/25"
              ><PhoneOff className="h-4 w-4" /> Leave</motion.button>

              {isHost && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={async () => { if (!groupId) return; haptic.heavy(); mediaStream?.getTracks().forEach((t) => t.stop()); await meetingService.endMeeting(groupId, meetingId); toast.success("Room ended"); router.push("/meetings"); }}
                  className="h-12 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white text-xs font-medium transition-all border border-white/[0.06] hidden sm:flex items-center"
                >End Room</motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <AnimatePresence>
          {showChat && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border-l border-white/[0.04] flex flex-col bg-[#0c0c12]/80 backdrop-blur-xl overflow-hidden flex-shrink-0"
            >
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <h2 className="text-xs font-bold text-white/70 uppercase tracking-widest">Live Chat</h2>
                </div>
                <span className="text-[10px] text-white/20">{chatMessages.length} msgs</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-white/5">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/[0.03] flex items-center justify-center"><MessageCircle className="h-5 w-5 text-white/10" /></div>
                    <p className="text-[11px] text-white/20">No messages yet</p>
                    <p className="text-[10px] text-white/10">Be the first to say hi!</p>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                    className="flex gap-2.5 group/msg"
                  >
                    <Avatar name={msg.senderName} src={msg.senderId === userId ? currentUser?.profilePictureUrl ?? undefined : undefined} size="xs" className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-semibold text-white/60">{msg.senderName}</span>
                        <span className="text-[9px] text-white/15">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-[12px] text-white/50 leading-relaxed mt-0.5">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="px-3 py-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-2.5 focus-within:border-brand-500/30 focus-within:bg-white/[0.06] transition-all">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message…"
                    className="flex-1 bg-transparent text-[13px] text-white placeholder-white/20 focus:outline-none"
                  />
                  <motion.button whileTap={{ scale: 0.8 }} type="submit" disabled={!chatInput.trim()}
                    className="h-8 w-8 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-20 disabled:bg-white/[0.04] text-white flex items-center justify-center transition-all"
                  ><Send className="h-3.5 w-3.5" /></motion.button>
                </div>
              </form>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Control Button ──────────────────────────────────────────────────────────
function CtrlBtn({ active, danger, highlight, onClick, children, label }: {
  active?: boolean; danger?: boolean; highlight?: boolean; onClick: () => void; children: React.ReactNode; label?: string;
}) {
  return (
    <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.85 }} onClick={onClick} title={label}
      className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
        danger ? "bg-red-500/15 text-red-400 hover:bg-red-500/25 shadow-red-500/10 border border-red-500/20" :
        highlight ? "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 shadow-yellow-500/10 border border-yellow-500/20" :
        active ? "bg-white/10 text-white hover:bg-white/15 shadow-white/5 border border-white/10" :
        "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.06]"
      }`}
    >{children}</motion.button>
  );
}
