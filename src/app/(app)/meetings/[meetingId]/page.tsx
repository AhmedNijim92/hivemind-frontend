"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Hand, ArrowLeft, Lock, Globe, Copy, Send,
  MessageCircle, Crown, Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useMeetingParticipants } from "@/hooks/use-meetings";
import { meetingService } from "@/services/meeting.service";
import { usePageTitle } from "@/hooks/use-page-title";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  userId: string;
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

  const [meetingData, setMeetingData] = useState<any>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Room state
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  const { data: participants } = useMeetingParticipants(meetingId);

  usePageTitle(meetingData?.title ?? "Live Room");

  // Load meeting data
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
          setError("Meeting not found. Please join from the meetings page.");
        }
      } catch {
        setError("Unable to load meeting.");
      }
      setLoading(false);
    }
    findMeeting();
  }, [meetingId]);

  // Join meeting on backend
  useEffect(() => {
    if (!meetingData || !groupId) return;
    if (meetingData.status !== "ACTIVE") return;
    meetingService.joinMeeting(groupId, meetingId).catch(() => {});
  }, [meetingData, groupId, meetingId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleLeave = async () => {
    try { await meetingService.leaveMeeting(meetingId); } catch {}
    router.push("/meetings");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId: userId ?? "",
      name: currentUser?.name ?? "You",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`);
    toast.success("Meeting link copied!");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="text-center space-y-4">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-16 w-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto">
            <Volume2 className="h-8 w-8 text-brand-400" />
          </motion.div>
          <p className="text-white/60 text-sm">Connecting…</p>
        </div>
      </div>
    );
  }

  if (error || !meetingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="text-5xl">🎙️</div>
          <h1 className="text-xl font-bold text-white">{error ?? "Room not found"}</h1>
          <Button onClick={() => router.push("/meetings")} variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to meetings
          </Button>
        </div>
      </div>
    );
  }

  if (meetingData.status === "SCHEDULED") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="text-center space-y-6 max-w-sm px-4">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="h-24 w-24 rounded-3xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-brand-500/30">
            <Volume2 className="h-12 w-12 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">{meetingData.title}</h1>
            <p className="text-white/50 text-sm mt-2">Waiting for the host to start this room…</p>
          </div>
          <Badge variant={meetingData.privacy === "PUBLIC" ? "success" : "warning"} className="mx-auto">
            {meetingData.privacy === "PUBLIC" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {meetingData.privacy === "PUBLIC" ? "Open to all" : "Group members only"}
          </Badge>
          <Button onClick={() => router.push("/meetings")} variant="ghost" className="text-white/60">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </div>
    );
  }

  if (meetingData.status === "ENDED") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="h-20 w-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
            <PhoneOff className="h-10 w-10 text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Room Closed</h1>
          <p className="text-white/50 text-sm">&quot;{meetingData.title}&quot; has ended.</p>
          <Button onClick={() => router.push("/meetings")} variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to meetings
          </Button>
        </div>
      </div>
    );
  }

  // ACTIVE — Live Room
  const isHost = meetingData.hostId === userId;
  const participantCount = participants?.length ?? meetingData.participantCount ?? 0;

  return (
    <div className="h-screen flex flex-col bg-[#0f0f13]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white">{meetingData.title}</h1>
              <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {meetingData.privacy === "PUBLIC" ? (
                <span className="text-[11px] text-white/40 flex items-center gap-1"><Globe className="h-3 w-3" /> Open room</span>
              ) : (
                <span className="text-[11px] text-white/40 flex items-center gap-1"><Lock className="h-3 w-3" /> Private room</span>
              )}
              <span className="text-[11px] text-white/30">·</span>
              <span className="text-[11px] text-white/40 flex items-center gap-1"><Users className="h-3 w-3" /> {participantCount} in room</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopyLink} className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-colors" title="Invite">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-xl transition-colors ${showChat ? "bg-brand-500/20 text-brand-400" : "hover:bg-white/5 text-white/50 hover:text-white"}`}>
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Stage — participant grid */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Participants as avatar circles */}
            <div className="flex flex-wrap justify-center items-center gap-6 h-full">
              {(participants ?? [userId ?? ""]).map((pId, idx) => {
                const isSelf = pId === userId;
                const isParticipantHost = pId === meetingData.hostId;
                return (
                  <motion.div
                    key={pId}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.1, type: "spring" }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="relative">
                      {/* Speaking ring animation */}
                      <motion.div
                        animate={isSelf && micOn ? { scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={`absolute inset-0 rounded-full ${isSelf && micOn ? "ring-4 ring-brand-400/50" : ""}`}
                      />
                      <div className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden ring-3 ${isParticipantHost ? "ring-yellow-400/60" : isSelf ? "ring-brand-400/40" : "ring-white/10"} shadow-xl`}>
                        <Avatar name={isSelf ? currentUser?.name : undefined} size="xl" className="h-full w-full text-2xl" />
                      </div>
                      {/* Mic indicator */}
                      {isSelf && !micOn && (
                        <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-[#0f0f13]">
                          <MicOff className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {isParticipantHost && (
                        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center ring-2 ring-[#0f0f13]">
                          <Crown className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white/70 font-medium max-w-[80px] truncate">
                      {isSelf ? "You" : `User ${idx + 1}`}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="px-6 py-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMicOn(!micOn)}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
                aria-label={micOn ? "Mute" : "Unmute"}
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setVideoOn(!videoOn)}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${videoOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                aria-label={videoOn ? "Turn off camera" : "Turn on camera"}
              >
                {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setHandRaised(!handRaised); toast(handRaised ? "Hand lowered" : "✋ Hand raised"); }}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${handRaised ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                aria-label={handRaised ? "Lower hand" : "Raise hand"}
              >
                <Hand className="h-5 w-5" />
              </motion.button>

              <div className="w-px h-8 bg-white/10 mx-2" />

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLeave}
                className="h-12 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 font-medium text-sm transition-colors"
              >
                <PhoneOff className="h-4 w-4" />
                Leave
              </motion.button>

              {isHost && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    if (groupId) {
                      await meetingService.endMeeting(groupId, meetingId);
                      toast.success("Room closed");
                      router.push("/meetings");
                    }
                  }}
                  className="h-12 px-4 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center gap-2 text-sm transition-colors"
                >
                  End room
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-white/5 flex flex-col bg-[#16161b]"
            >
              <div className="px-4 py-3 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Live Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-white/30 text-center mt-8">No messages yet. Say hi! 👋</p>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <Avatar name={msg.name} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white/80">{msg.name}</span>
                        <span className="text-[10px] text-white/30">{msg.time}</span>
                      </div>
                      <p className="text-sm text-white/60 break-words">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="px-3 py-3 border-t border-white/5">
                <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Say something…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50"
                  />
                  <button type="submit" className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
