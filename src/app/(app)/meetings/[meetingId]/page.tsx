"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Monitor, MessageCircle, Settings, Hand, ArrowLeft,
  Lock, Globe, Copy, Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useMeeting, useMeetingParticipants, useJoinMeeting } from "@/hooks/use-meetings";
import { meetingService } from "@/services/meeting.service";
import { usePageTitle } from "@/hooks/use-page-title";
import toast from "react-hot-toast";

export default function MeetingRoomPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = use(params);
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // We need groupId to fetch meeting — try from query params or find it
  // For now, we'll use a search approach since meetingId is globally unique
  const [groupId, setGroupId] = useState<string | null>(null);
  const [meetingData, setMeetingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: participants } = useMeetingParticipants(meetingId);

  usePageTitle(meetingData?.title ?? "Meeting Room");

  // Find the meeting by checking user's groups
  useEffect(() => {
    async function findMeeting() {
      try {
        // Try to get meeting from localStorage breadcrumb
        const stored = sessionStorage.getItem(`meeting-${meetingId}`);
        if (stored) {
          const { groupId: gId } = JSON.parse(stored);
          setGroupId(gId);
          const meeting = await meetingService.getMeeting(gId, meetingId);
          setMeetingData(meeting);
          setLoading(false);
          return;
        }
        setError("Meeting not found. Please join from the meetings page.");
        setLoading(false);
      } catch {
        setError("Unable to load meeting.");
        setLoading(false);
      }
    }
    findMeeting();
  }, [meetingId]);

  // Join meeting on backend when entering room
  useEffect(() => {
    if (!meetingData || !groupId || hasJoined) return;
    if (meetingData.status !== "ACTIVE") return;

    meetingService.joinMeeting(groupId, meetingId)
      .then(() => setHasJoined(true))
      .catch(() => {}); // may already be joined
  }, [meetingData, groupId, meetingId, hasJoined]);

  // Load Jitsi Meet
  useEffect(() => {
    if (!meetingData || !jitsiContainerRef.current || jitsiLoaded) return;
    if (meetingData.status !== "ACTIVE") return;

    const domain = "meet.jit.si";
    const roomName = `hivemind-${meetingData.groupId}-${meetingId}`.replace(/[^a-zA-Z0-9-]/g, "");

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => {
      if (!(window as any).JitsiMeetExternalAPI) return;

      const api = new (window as any).JitsiMeetExternalAPI(domain, {
        roomName,
        parentNode: jitsiContainerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [
            "microphone", "camera", "desktop", "chat",
            "raisehand", "tileview", "fullscreen",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          MOBILE_APP_PROMO: false,
        },
        userInfo: {
          displayName: currentUser?.name ?? "Participant",
          email: currentUser?.email ?? "",
        },
      });

      api.addEventListener("readyToClose", () => {
        handleLeave();
      });

      setJitsiLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [meetingData, meetingId, currentUser, jitsiLoaded]);

  const handleLeave = async () => {
    try {
      await meetingService.leaveMeeting(meetingId);
    } catch {}
    router.push("/meetings");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`);
    toast.success("Meeting link copied!");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/70">Connecting to meeting…</p>
        </div>
      </div>
    );
  }

  if (error || !meetingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="text-5xl">📹</div>
          <h1 className="text-xl font-bold text-white">{error ?? "Meeting not found"}</h1>
          <Button onClick={() => router.push("/meetings")} variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to meetings
          </Button>
        </div>
      </div>
    );
  }

  if (meetingData.status === "SCHEDULED") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4 max-w-sm px-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-20 w-20 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto"
          >
            <Video className="h-10 w-10 text-brand-400" />
          </motion.div>
          <h1 className="text-xl font-bold text-white">{meetingData.title}</h1>
          <p className="text-white/60 text-sm">This meeting hasn't started yet. The host needs to start it first.</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant={meetingData.privacy === "PUBLIC" ? "success" : "warning"}>
              {meetingData.privacy === "PUBLIC" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {meetingData.privacy}
            </Badge>
          </div>
          <Button onClick={() => router.push("/meetings")} variant="secondary" className="mt-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
      </div>
    );
  }

  if (meetingData.status === "ENDED") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold text-white">Meeting Ended</h1>
          <p className="text-white/60 text-sm">{meetingData.title} has ended.</p>
          <Button onClick={() => router.push("/meetings")} variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to meetings
          </Button>
        </div>
      </div>
    );
  }

  // ACTIVE meeting — show Jitsi
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <button onClick={handleLeave} className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-white/70 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-white">{meetingData.title}</h1>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-white/50">Live</span>
              <Badge variant={meetingData.privacy === "PUBLIC" ? "success" : "warning"} className="text-[9px] h-4">
                {meetingData.privacy === "PUBLIC" ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                {meetingData.privacy}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white/80 text-xs font-medium transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            {participants?.length ?? 0}
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-white/70 hover:text-white"
            title="Copy meeting link"
          >
            <Copy className="h-4 w-4" />
          </button>
          <Button size="sm" variant="secondary" onClick={handleLeave} className="bg-red-600 hover:bg-red-700 border-0 text-white">
            <PhoneOff className="h-3.5 w-3.5" /> Leave
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Jitsi container */}
        <div ref={jitsiContainerRef} className="flex-1" />

        {/* Participants panel */}
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-gray-800 border-l border-gray-700/50 overflow-y-auto"
            >
              <div className="p-4">
                <h2 className="text-sm font-semibold text-white mb-3">
                  Participants ({participants?.length ?? 0})
                </h2>
                <div className="space-y-2">
                  {participants?.map((pId) => (
                    <div key={pId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50">
                      <Avatar name={pId === userId ? currentUser?.name : undefined} size="sm" />
                      <span className="text-sm text-white/80 truncate">
                        {pId === userId ? (currentUser?.name ?? "You") : `Participant`}
                      </span>
                      {pId === meetingData.hostId && (
                        <Badge variant="brand" className="text-[9px] ml-auto">Host</Badge>
                      )}
                    </div>
                  )) ?? (
                    <p className="text-xs text-white/40">No participants yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
