"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Hand, ArrowLeft, Copy, Send,
  MessageCircle, Crown, Heart, Flame, ThumbsUp, Laugh,
  Sparkles, Zap, Monitor,
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

interface FloatingReaction { id: string; emoji: string; x: number; size: number; }
interface ChatOverlayMessage { id: string; senderName: string; content: string; timestamp: number; }

const REACTIONS = [
  { emoji: "❤️", icon: Heart },
  { emoji: "🔥", icon: Flame },
  { emoji: "👍", icon: ThumbsUp },
  { emoji: "😂", icon: Laugh },
  { emoji: "✨", icon: Sparkles },
  { emoji: "⚡", icon: Zap },
];

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
  const [overlayMessages, setOverlayMessages] = useState<ChatOverlayMessage[]>([]);

  const { data: participants } = useMeetingParticipants(meetingId);
  const chatConversationId = `meeting_${meetingId}`;
  const chatMessages = useMessages(chatConversationId);
  const sendChatMsg = useSendMessage();
  usePageTitle(meetingData?.title ?? "Live Room");

  useEffect(() => {
    const stored = sessionStorage.getItem(`meeting-${meetingId}`);
    if (!stored) { setError("Room not found."); setLoading(false); return; }
    const { groupId: gId } = JSON.parse(stored);
    setGroupId(gId);
    meetingService.getMeeting(gId, meetingId).then((m) => setMeetingData(m)).catch(() => setError("Unable to connect.")).finally(() => setLoading(false));
  }, [meetingId]);

  useEffect(() => { if (!meetingData || !groupId || meetingData.status !== "ACTIVE") return; meetingService.joinMeeting(groupId, meetingId).catch(() => {}); }, [meetingData, groupId, meetingId]);

  const startCamera = useCallback(async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: micOn }); setMediaStream(stream); setVideoOn(true); setTimeout(() => { if (localVideoRef.current) localVideoRef.current.srcObject = stream; }, 50); } catch { toast.error("Could not access camera."); } }, [micOn]);
  const stopCamera = useCallback(() => { if (mediaStream) { mediaStream.getVideoTracks().forEach((t) => t.stop()); if (!micOn) { mediaStream.getAudioTracks().forEach((t) => t.stop()); setMediaStream(null); } } setVideoOn(false); }, [mediaStream, micOn]);
  const toggleVideo = useCallback(() => { haptic.tap(); if (videoOn) stopCamera(); else startCamera(); }, [videoOn, startCamera, stopCamera, haptic]);
  const toggleMic = useCallback(async () => { haptic.tap(); if (micOn) { mediaStream?.getAudioTracks().forEach((t) => t.stop()); setMicOn(false); } else { try { if (mediaStream) { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getAudioTracks().forEach((t) => mediaStream.addTrack(t)); } else { setMediaStream(await navigator.mediaDevices.getUserMedia({ audio: true })); } setMicOn(true); } catch { toast.error("Microphone access denied"); } } }, [micOn, mediaStream, haptic]);
  const toggleScreenShare = useCallback(() => { haptic.tap(); setScreenSharing((p) => !p); toast(screenSharing ? "Stopped sharing" : "Sharing screen"); }, [screenSharing, haptic]);

  useEffect(() => { if (localVideoRef.current && mediaStream && videoOn) localVideoRef.current.srcObject = mediaStream; }, [mediaStream, videoOn]);
  useEffect(() => { return () => { mediaStream?.getTracks().forEach((t) => t.stop()); }; }, [mediaStream]);

  // Overlay chat messages
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (chatMessages.length > prevMsgCountRef.current) {
      const newMsgs = chatMessages.slice(prevMsgCountRef.current);
      setOverlayMessages((prev) => [...prev, ...newMsgs.map((m) => ({ id: m.id, senderName: m.senderName, content: m.content, timestamp: Date.now() }))].slice(-10));
    }
    prevMsgCountRef.current = chatMessages.length;
  }, [chatMessages]);

  useEffect(() => { if (!overlayMessages.length) return; const t = setInterval(() => { setOverlayMessages((p) => p.filter((m) => Date.now() - m.timestamp < 8000)); }, 1000); return () => clearInterval(t); }, [overlayMessages]);

  const handleSendChat = () => { if (!chatInput.trim()) return; haptic.tap(); sendChatMsg(chatConversationId, currentUser?.name ?? "User", chatInput.trim()); setChatInput(""); };
  const sendReaction = (emoji: string) => { haptic.tap(); setFloatingReactions((p) => [...p, { id: crypto.randomUUID(), emoji, x: 75 + Math.random() * 20, size: 1.5 + Math.random() * 1.5 }]); setTimeout(() => setFloatingReactions((p) => p.slice(1)), 4000); };
  const handleLeave = async () => { haptic.heavy(); mediaStream?.getTracks().forEach((t) => t.stop()); try { await meetingService.leaveMeeting(meetingId); } catch {} router.push("/meetings"); };

  // Status screens
  if (loading) return (<div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e]"><motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}><div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-brand-500/40"><Sparkles className="h-10 w-10 text-white" /></div></motion.div></div>);
  if (error || !meetingData) return (<div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] gap-6"><div className="h-24 w-24 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10"><PhoneOff className="h-10 w-10 text-white/30" /></div><h1 className="text-lg font-bold text-white">{error}</h1><button onClick={() => router.push("/meetings")} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button></div>);
  if (meetingData.status === "SCHEDULED") return (<div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] gap-6"><motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}><div className="h-28 w-28 rounded-full bg-gradient-to-br from-brand-500/20 to-indigo-600/20 border border-brand-500/30 flex items-center justify-center"><Mic className="h-14 w-14 text-brand-400" /></div></motion.div><h1 className="text-xl font-bold text-white">{meetingData.title}</h1><p className="text-white/40 text-sm">Waiting for host…</p><button onClick={() => router.push("/meetings")} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button></div>);
  if (meetingData.status === "ENDED") return (<div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] gap-6"><div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><PhoneOff className="h-10 w-10 text-white/20" /></div><h1 className="text-lg font-bold text-white">Room ended</h1><button onClick={() => router.push("/meetings")} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button></div>);

  const isHost = meetingData.hostId === userId;
  const participantList = participants ?? [userId ?? ""];
  const count = participantList.length;
  const isMainSpeakerSelf = participantList[0] === userId;

  return (
    <div className="h-screen w-screen fixed inset-0 bg-black select-none overflow-hidden">
      {/* FULL-SCREEN BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {isMainSpeakerSelf && videoOn ? (
          <video ref={localVideoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e]">
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
            <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-500/20 rounded-full blur-[100px]" />
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 12, repeat: Infinity, delay: 4 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />

            {/* Center avatar with rotating ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute -inset-5 rounded-full opacity-60" style={{ background: "conic-gradient(from 0deg, #8b5cf6, #3b82f6, #06b6d4, #ec4899, #8b5cf6)" }} />
                <motion.div animate={micOn ? { scale: [1, 1.05, 1], opacity: [0.3, 0.7, 0.3] } : {}} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -inset-5 rounded-full bg-purple-500/30 blur-md" />
                <div className="relative h-40 w-40 sm:h-52 sm:w-52 rounded-full overflow-hidden ring-4 ring-black/60 shadow-2xl">
                  {currentUser?.profilePictureUrl && isMainSpeakerSelf ? (
                    <img src={currentUser.profilePictureUrl} alt={currentUser.name ?? "Speaker"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">{(isMainSpeakerSelf ? currentUser?.name?.[0] : "?")?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                {participantList[0] === meetingData.hostId && <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-4 left-1/2 -translate-x-1/2"><Crown className="h-7 w-7 text-yellow-400 drop-shadow-lg" /></motion.div>}
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap"><span className="px-5 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-sm font-semibold text-white shadow-lg">{isMainSpeakerSelf ? (currentUser?.name ?? "You") : "Speaker"}</span></div>
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* TOP BAR */}
      <header className="absolute top-0 inset-x-0 z-30 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.85 }} onClick={handleLeave} className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"><ArrowLeft className="h-4 w-4" /></motion.button>
            <h1 className="text-sm font-bold text-white drop-shadow-lg truncate max-w-[120px] sm:max-w-[200px]">{meetingData.title}</h1>
            <span className="flex items-center gap-1.5 text-[10px] bg-red-500 text-white px-2.5 py-1 rounded-full font-bold shadow-lg shadow-red-500/40"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10"><Users className="h-3 w-3 text-white/60" /><span className="text-xs font-semibold text-white/80">{count}</span></div>
          </div>
          <div className="flex items-center gap-2">
            {participantList.slice(1, 6).map((pId, i) => (<div key={pId} className="h-8 w-8 rounded-full ring-2 ring-black/60 overflow-hidden shadow-lg hidden sm:block"><Avatar name={pId === userId ? currentUser?.name : `User ${i + 2}`} size="xs" className="h-full w-full" /></div>))}
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`); toast.success("Link copied"); }} className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white"><Copy className="h-3.5 w-3.5" /></motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowChat(!showChat)} className={`h-9 w-9 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${showChat ? "bg-brand-500/30 border-brand-500/50 text-brand-300" : "bg-black/40 border-white/10 text-white/60"}`}><MessageCircle className="h-3.5 w-3.5" /></motion.button>
          </div>
        </div>
      </header>

      {/* CHAT OVERLAY — left side TikTok style */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute left-4 sm:left-6 bottom-28 z-20 w-72 sm:w-80 max-h-[40vh] flex flex-col justify-end pointer-events-none">
            <div className="space-y-2 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {overlayMessages.slice(-8).map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} className="pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/[0.06] w-fit max-w-full">
                      <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0"><Avatar name={msg.senderName} size="xs" className="h-full w-full" /></div>
                      <span className="text-[11px] font-bold text-brand-300 flex-shrink-0">{msg.senderName}</span>
                      <span className="text-[12px] text-white/70 truncate">{msg.content}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="mt-3 pointer-events-auto">
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 focus-within:border-brand-500/30 transition-all">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Say something…" className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
                <motion.button whileTap={{ scale: 0.8 }} type="submit" disabled={!chatInput.trim()} className="h-8 w-8 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-20 text-white flex items-center justify-center"><Send className="h-3.5 w-3.5" /></motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING REACTIONS — right side */}
      <div className="absolute right-6 sm:right-10 bottom-28 top-20 z-20 w-16 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 1, y: 0, scale: 0.3 }} animate={{ opacity: [1, 1, 0.8, 0], y: -600, scale: [0.3, r.size, r.size * 0.8], x: [0, Math.random() * 30 - 15, Math.random() * 20 - 10], rotate: [0, Math.random() * 30 - 15] }} transition={{ duration: 3.5, ease: "easeOut" }} className="absolute bottom-0 left-1/2 text-4xl" style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.4))" }}>{r.emoji}</motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HAND RAISED */}
      <AnimatePresence>
        {handRaised && (<motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-yellow-500/20 backdrop-blur-xl border border-yellow-500/30 flex items-center gap-2"><span className="text-lg">✋</span><span className="text-xs font-medium text-yellow-300">Hand raised</span></motion.div>)}
      </AnimatePresence>

      {/* SCREEN SHARE */}
      <AnimatePresence>
        {screenSharing && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-20 z-10 rounded-3xl bg-black/70 backdrop-blur-2xl border border-white/10 flex flex-col items-center justify-center gap-5"><div className="h-20 w-20 rounded-3xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center"><Monitor className="h-10 w-10 text-brand-400" /></div><p className="text-white/80 font-medium">Sharing screen</p><button onClick={toggleScreenShare} className="px-6 py-2.5 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold border border-red-500/30 hover:bg-red-500/30 transition-all">Stop</button></motion.div>)}
      </AnimatePresence>

      {/* BOTTOM CONTROL BAR */}
      <div className="absolute bottom-6 inset-x-0 z-30 flex justify-center px-4">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }} className="flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-3.5 rounded-full bg-black/50 backdrop-blur-2xl border border-white/[0.08] shadow-2xl">
          <CtrlBtn on={micOn} danger={!micOn} onClick={toggleMic}>{micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</CtrlBtn>
          <CtrlBtn on={videoOn} onClick={toggleVideo}>{videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}</CtrlBtn>
          <CtrlBtn on={screenSharing} highlight onClick={toggleScreenShare}><Monitor className="h-5 w-5" /></CtrlBtn>
          <CtrlBtn on={handRaised} highlight onClick={() => { haptic.tap(); setHandRaised(!handRaised); }}><Hand className="h-5 w-5" /></CtrlBtn>
          <div className="relative">
            <CtrlBtn on={showReactions} pink onClick={() => setShowReactions(!showReactions)}><Heart className="h-5 w-5" /></CtrlBtn>
            <AnimatePresence>
              {showReactions && (
                <motion.div initial={{ opacity: 0, scale: 0.7, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7, y: 10 }} className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-2.5 rounded-full bg-black/70 backdrop-blur-2xl border border-white/10 flex gap-1.5 shadow-2xl">
                  {REACTIONS.map((r) => (<motion.button key={r.emoji} whileHover={{ scale: 1.4, y: -6 }} whileTap={{ scale: 1.8 }} onClick={() => { sendReaction(r.emoji); setShowReactions(false); }} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center text-xl">{r.emoji}</motion.button>))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleLeave} className="h-12 px-5 sm:px-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 text-sm font-bold shadow-lg shadow-red-500/30"><PhoneOff className="h-4 w-4" /><span className="hidden sm:inline">Leave</span></motion.button>
          {isHost && <motion.button whileTap={{ scale: 0.9 }} onClick={async () => { if (!groupId) return; haptic.heavy(); mediaStream?.getTracks().forEach((t) => t.stop()); await meetingService.endMeeting(groupId, meetingId); toast.success("Room ended"); router.push("/meetings"); }} className="hidden sm:flex h-12 px-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white items-center text-xs font-medium">End</motion.button>}
        </motion.div>
      </div>
    </div>
  );
}

function CtrlBtn({ on, danger, highlight, pink, onClick, children }: { on?: boolean; danger?: boolean; highlight?: boolean; pink?: boolean; onClick: () => void; children: React.ReactNode; }) {
  const cls = danger && !on ? "bg-red-500/20 text-red-400 border-red-500/30" :
    pink && on ? "bg-pink-500/20 text-pink-400 border-pink-500/30" :
    highlight && on ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
    on ? "bg-white/15 text-white border-white/20" :
    "bg-white/5 text-white/40 border-white/10 hover:text-white/70 hover:bg-white/10";
  return (<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }} onClick={onClick} className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border ${cls}`}>{children}</motion.button>);
}
