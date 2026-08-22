"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Hand, ArrowLeft, Copy, Send, Crown,
  MessageCircle, Heart, Flame, ThumbsUp, Laugh,
  Sparkles, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  TrackToggle,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { useHaptic } from "@/hooks/use-haptic";
import { meetingService } from "@/services/meeting.service";
import { apiClient } from "@/services/api-client";
import { usePageTitle } from "@/hooks/use-page-title";
import toast from "react-hot-toast";

interface FloatingReaction { id: string; emoji: string; x: number; size: number; }
interface ChatOverlayMessage { id: string; senderName: string; content: string; timestamp: number; }

const REACTIONS = [
  { emoji: "❤️" }, { emoji: "🔥" }, { emoji: "👍" },
  { emoji: "😂" }, { emoji: "✨" }, { emoji: "⚡" },
];

export default function MeetingRoomPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params);
  const router = useRouter();
  const haptic = useHaptic();
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();

  const [meetingData, setMeetingData] = useState<any>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string>("");
  const [liveKitUrl, setLiveKitUrl] = useState<string>("");
  const [showChat, setShowChat] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [overlayMessages, setOverlayMessages] = useState<ChatOverlayMessage[]>([]);
  const [handRaised, setHandRaised] = useState(false);

  const chatConversationId = `meeting_${meetingId}`;
  const chatMessages = useMessages(chatConversationId);
  const sendChatMsg = useSendMessage();
  usePageTitle(meetingData?.title ?? "Live Room");

  // Hide mobile nav
  useEffect(() => { document.body.classList.add("meeting-active"); return () => { document.body.classList.remove("meeting-active"); }; }, []);

  // Load meeting & get token
  useEffect(() => {
    const stored = sessionStorage.getItem(`meeting-${meetingId}`);
    if (!stored) { setError("Room not found."); setLoading(false); return; }
    const { groupId: gId } = JSON.parse(stored);
    setGroupId(gId);

    meetingService.getMeeting(gId, meetingId)
      .then(async (m) => {
        setMeetingData(m);
        if (m.status === "ACTIVE") {
          await meetingService.joinMeeting(gId, meetingId).catch(() => {});
          // Get LiveKit token
          const res = await apiClient.post(`/api/v1/meetings/${meetingId}/token`, { isHost: m.hostId === userId });
          setLiveKitToken(res.data.token);
          // Build LiveKit URL from current origin — gateway proxies /livekit to LiveKit server
          const origin = window.location.origin;
          const wsUrl = origin.replace("http://", "ws://").replace("https://", "wss://") + "/livekit";
          setLiveKitUrl(res.data.url !== "__RESOLVE_FROM_ORIGIN__" ? res.data.url : wsUrl);
        }
      })
      .catch(() => setError("Unable to connect."))
      .finally(() => setLoading(false));
  }, [meetingId, userId]);

  // Chat overlay
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (chatMessages.length > prevMsgCountRef.current) {
      const newMsgs = chatMessages.slice(prevMsgCountRef.current);
      setOverlayMessages((prev) => [...prev, ...newMsgs.map((m: any) => ({ id: m.id, senderName: m.senderName, content: m.content, timestamp: Date.now() }))].slice(-10));
    }
    prevMsgCountRef.current = chatMessages.length;
  }, [chatMessages]);
  useEffect(() => { if (!overlayMessages.length) return; const t = setInterval(() => { setOverlayMessages((p) => p.filter((m) => Date.now() - m.timestamp < 8000)); }, 1000); return () => clearInterval(t); }, [overlayMessages]);

  const handleSendChat = () => { if (!chatInput.trim()) return; haptic.tap(); sendChatMsg(chatConversationId, currentUser?.name ?? "User", chatInput.trim()); setChatInput(""); };
  const sendReaction = (emoji: string) => { haptic.tap(); setFloatingReactions((p) => [...p, { id: crypto.randomUUID(), emoji, x: 75 + Math.random() * 20, size: 1.5 + Math.random() * 1.5 }]); setTimeout(() => setFloatingReactions((p) => p.slice(1)), 4000); };
  const handleLeave = async () => { haptic.heavy(); try { await meetingService.leaveMeeting(meetingId); } catch {} router.push("/meetings"); };

  // Status screens
  if (loading) return (<div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e]"><motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}><div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-brand-500/40"><Sparkles className="h-10 w-10 text-white" /></div></motion.div></div>);
  if (error || !meetingData) return (<div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] gap-6"><div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><PhoneOff className="h-10 w-10 text-white/30" /></div><h1 className="text-lg font-bold text-white">{error}</h1><button onClick={() => router.push("/meetings")} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button></div>);
  if (meetingData.status !== "ACTIVE") return (<div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e] gap-6"><motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}><div className="h-28 w-28 rounded-full bg-gradient-to-br from-brand-500/20 to-indigo-600/20 border border-brand-500/30 flex items-center justify-center"><Mic className="h-14 w-14 text-brand-400" /></div></motion.div><h1 className="text-xl font-bold text-white">{meetingData.title}</h1><p className="text-white/40 text-sm">{meetingData.status === "ENDED" ? "Room ended" : "Waiting for host…"}</p><button onClick={() => router.push("/meetings")} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button></div>);

  if (!liveKitToken || !liveKitUrl) return (<div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e]"><motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><p className="text-white/50 text-sm">Connecting to room…</p></motion.div></div>);

  const isHost = meetingData.hostId === userId;

  return (
    <LiveKitRoom
      token={liveKitToken}
      serverUrl={liveKitUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={() => { toast.error("Disconnected from room"); }}
      onError={(err) => { console.error("LiveKit error:", err); toast.error("Connection error"); }}
      className="h-screen w-screen fixed inset-0 bg-black select-none overflow-hidden z-[60]"
    >
      <RoomAudioRenderer />
      <MeetingRoomUI
        meetingData={meetingData}
        meetingId={meetingId}
        groupId={groupId}
        isHost={isHost}
        showChat={showChat}
        setShowChat={setShowChat}
        showReactions={showReactions}
        setShowReactions={setShowReactions}
        chatInput={chatInput}
        setChatInput={setChatInput}
        overlayMessages={overlayMessages}
        floatingReactions={floatingReactions}
        handRaised={handRaised}
        setHandRaised={setHandRaised}
        handleSendChat={handleSendChat}
        sendReaction={sendReaction}
        handleLeave={handleLeave}
        currentUser={currentUser}
        haptic={haptic}
      />
    </LiveKitRoom>
  );
}

/** Inner UI component that has access to LiveKit room context */
function MeetingRoomUI({
  meetingData, meetingId, groupId, isHost,
  showChat, setShowChat, showReactions, setShowReactions,
  chatInput, setChatInput, overlayMessages, floatingReactions,
  handRaised, setHandRaised, handleSendChat, sendReaction, handleLeave,
  currentUser, haptic,
}: any) {
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone], { onlySubscribed: false });
  const room = useRoomContext();

  const isMicOn = localParticipant.isMicrophoneEnabled;
  const isCamOn = localParticipant.isCameraEnabled;
  const count = participants.length;

  return (
    <>
      {/* BACKGROUND — show video of speaker or gradient */}
      <div className="absolute inset-0 z-0">
        {/* Find first video track to show full screen */}
        {(() => {
          const videoTracks = tracks.filter((t) => t.source === Track.Source.Camera && t.publication?.isSubscribed);
          if (videoTracks.length > 0 && videoTracks[0].publication?.track) {
            return <VideoTrack trackRef={videoTracks[0]} className="absolute inset-0 w-full h-full object-cover" />;
          }
          return (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a1a2e]">
              <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
              <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-500/20 rounded-full blur-[100px]" />
              {/* Participant avatars grid */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-wrap gap-6 justify-center items-center max-w-lg">
                  {participants.map((p) => (
                    <motion.div key={p.identity} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
                      <div className={`relative h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden ring-4 ${p.isSpeaking ? "ring-green-400/60" : "ring-white/10"} shadow-xl transition-all`}>
                        {currentUser?.profilePictureUrl && p.identity === localParticipant.localParticipant?.identity ? (
                          <img src={currentUser.profilePictureUrl} alt={p.name ?? p.identity} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">{(p.name ?? p.identity)?.[0]?.toUpperCase() ?? "?"}</span>
                          </div>
                        )}
                        {p.isSpeaking && (
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="absolute inset-0 rounded-full ring-4 ring-green-400/40" />
                        )}
                      </div>
                      <span className="text-xs text-white/70 font-medium flex items-center gap-1">
                        {p.identity === meetingData.hostId && <Crown className="h-3 w-3 text-yellow-400" />}
                        {p.name ?? p.identity.slice(0, 8)}
                      </span>
                      {!p.isMicrophoneEnabled && <MicOff className="h-3 w-3 text-red-400" />}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      </div>

      {/* TOP BAR */}
      <header className="absolute top-0 inset-x-0 z-30 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.85 }} onClick={handleLeave} className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70"><ArrowLeft className="h-4 w-4" /></motion.button>
            <h1 className="text-sm font-bold text-white drop-shadow-lg truncate max-w-[120px] sm:max-w-[200px]">{meetingData.title}</h1>
            <span className="flex items-center gap-1.5 text-[10px] bg-red-500 text-white px-2.5 py-1 rounded-full font-bold shadow-lg shadow-red-500/40"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10"><Users className="h-3 w-3 text-white/60" /><span className="text-xs font-semibold text-white/80">{count}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`); toast.success("Link copied"); }} className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white"><Copy className="h-3.5 w-3.5" /></motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowChat(!showChat)} className={`h-9 w-9 rounded-full backdrop-blur-xl border flex items-center justify-center ${showChat ? "bg-brand-500/30 border-brand-500/50 text-brand-300" : "bg-black/40 border-white/10 text-white/60"}`}><MessageCircle className="h-3.5 w-3.5" /></motion.button>
          </div>
        </div>
      </header>

      {/* CHAT OVERLAY */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute left-4 sm:left-6 bottom-28 z-20 w-72 sm:w-80 max-h-[40vh] flex flex-col justify-end pointer-events-none">
            <div className="space-y-2 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {overlayMessages.slice(-8).map((msg: ChatOverlayMessage) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} className="pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/[0.06] w-fit max-w-full">
                      <Avatar name={msg.senderName} size="xs" className="h-6 w-6 flex-shrink-0" />
                      <span className="text-[11px] font-bold text-brand-300 flex-shrink-0">{msg.senderName}</span>
                      <span className="text-[12px] text-white/70 truncate">{msg.content}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="mt-3 pointer-events-auto">
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 focus-within:border-brand-500/30">
                <input value={chatInput} onChange={(e: any) => setChatInput(e.target.value)} placeholder="Say something…" className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none" />
                <motion.button whileTap={{ scale: 0.8 }} type="submit" disabled={!chatInput.trim()} className="h-8 w-8 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-20 text-white flex items-center justify-center"><Send className="h-3.5 w-3.5" /></motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING REACTIONS */}
      <div className="absolute right-6 sm:right-10 bottom-28 top-20 z-20 w-16 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((r: FloatingReaction) => (
            <motion.div key={r.id} initial={{ opacity: 1, y: 0, scale: 0.3 }} animate={{ opacity: [1, 1, 0.8, 0], y: -600, scale: [0.3, r.size, r.size * 0.8] }} transition={{ duration: 3.5, ease: "easeOut" }} className="absolute bottom-0 left-1/2 text-4xl" style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.4))" }}>{r.emoji}</motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HAND RAISED */}
      <AnimatePresence>
        {handRaised && (<motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-yellow-500/20 backdrop-blur-xl border border-yellow-500/30 flex items-center gap-2"><span className="text-lg">✋</span><span className="text-xs font-medium text-yellow-300">Hand raised</span></motion.div>)}
      </AnimatePresence>

      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-6 inset-x-0 z-30 flex justify-center px-4">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }} className="flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-3.5 rounded-full bg-black/50 backdrop-blur-2xl border border-white/[0.08] shadow-2xl">
          {/* Mic toggle via LiveKit */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
            onClick={() => { haptic.tap(); room.localParticipant.setMicrophoneEnabled(!isMicOn); }}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border ${!isMicOn ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/15 text-white border-white/20"}`}
          >{isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</motion.button>

          {/* Camera toggle via LiveKit */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
            onClick={() => { haptic.tap(); room.localParticipant.setCameraEnabled(!isCamOn); }}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border ${isCamOn ? "bg-white/15 text-white border-white/20" : "bg-white/5 text-white/40 border-white/10"}`}
          >{isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}</motion.button>

          {/* Hand raise */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
            onClick={() => { haptic.tap(); setHandRaised(!handRaised); toast(handRaised ? "Hand lowered" : "✋ Raised"); }}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border ${handRaised ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-white/5 text-white/40 border-white/10"}`}
          ><Hand className="h-5 w-5" /></motion.button>

          {/* Reactions */}
          <div className="relative">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
              onClick={() => setShowReactions(!showReactions)}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border ${showReactions ? "bg-pink-500/20 text-pink-400 border-pink-500/30" : "bg-white/5 text-white/40 border-white/10"}`}
            ><Heart className="h-5 w-5" /></motion.button>
            <AnimatePresence>
              {showReactions && (
                <motion.div initial={{ opacity: 0, scale: 0.7, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7, y: 10 }} className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-2.5 rounded-full bg-black/70 backdrop-blur-2xl border border-white/10 flex gap-1.5 shadow-2xl">
                  {REACTIONS.map((r) => (<motion.button key={r.emoji} whileHover={{ scale: 1.4, y: -6 }} whileTap={{ scale: 1.8 }} onClick={() => { sendReaction(r.emoji); setShowReactions(false); }} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center text-xl">{r.emoji}</motion.button>))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />

          {/* Leave */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleLeave} className="h-12 px-5 sm:px-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 text-sm font-bold shadow-lg shadow-red-500/30"><PhoneOff className="h-4 w-4" /><span className="hidden sm:inline">Leave</span></motion.button>

          {/* End (host) */}
          {isHost && <motion.button whileTap={{ scale: 0.9 }} onClick={async () => { if (!groupId) return; haptic.heavy(); await meetingService.endMeeting(groupId, meetingId); toast.success("Room ended"); handleLeave(); }} className="hidden sm:flex h-12 px-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white items-center text-xs font-medium">End</motion.button>}
        </motion.div>
      </div>
    </>
  );
}
