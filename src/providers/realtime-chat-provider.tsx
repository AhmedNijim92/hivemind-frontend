"use client";

import { createContext, useContext, useEffect, useCallback, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useChatStore } from "@/store/chat-store";

/**
 * Realtime chat provider using WebSocket STOMP.
 * Connects to the meeting-service WebSocket and syncs chat messages
 * between users in real-time.
 *
 * Subscribes to:
 *   /topic/chat/{conversationId} for each active conversation
 *
 * Sends via:
 *   /app/chat/{conversationId}
 */

interface RealtimeContextValue {
  connected: boolean;
  sendRealtimeMessage: (conversationId: string, content: string, imageUrl?: string) => void;
  subscribeMeeting: (meetingId: string, onMessage: (msg: any) => void, onReaction?: (r: any) => void) => () => void;
  sendMeetingMessage: (meetingId: string, content: string) => void;
  sendMeetingReaction: (meetingId: string, emoji: string) => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  sendRealtimeMessage: () => {},
  subscribeMeeting: () => () => {},
  sendMeetingMessage: () => {},
  sendMeetingReaction: () => {},
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

// STOMP helpers
function encodeFrame(command: string, headers: Record<string, string>, body = ""): string {
  let frame = command + "\n";
  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }
  frame += "\n" + body + "\0";
  return frame;
}

function decodeFrame(data: string) {
  const lines = data.split("\n");
  const command = lines[0];
  const headers: Record<string, string> = {};
  let i = 1;
  while (i < lines.length && lines[i] !== "") {
    const [key, ...parts] = lines[i].split(":");
    headers[key] = parts.join(":");
    i++;
  }
  const body = lines.slice(i + 1).join("\n").replace(/\0$/, "");
  return { command, headers, body };
}

export function RealtimeChatProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const subIdRef = useRef(0);
  const callbacksRef = useRef<Map<string, (msg: any) => void>>(new Map());

  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const sendStoreMessage = useChatStore((s) => s.sendMessage);

  // Connect WebSocket
  useEffect(() => {
    if (!userId) return;

    // For WebSocket, connect to the same origin on /ws path.
    // This works when the API gateway is directly accessible (localhost:8080)
    // or when an ingress/load balancer handles the upgrade.
    // Falls back to polling if WebSocket connection fails.
    const wsProtocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = typeof window !== "undefined" ? window.location.host : "localhost:3000";
    const wsUrl = `${wsProtocol}//${wsHost}/ws/websocket`;

    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    let retries = 0;
    const maxRetries = 3;
    const activeConversations = useChatStore.getState().conversations;

    function connect() {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(encodeFrame("CONNECT", { "accept-version": "1.2", "heart-beat": "10000,10000" }));
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        const frame = decodeFrame(event.data);

        if (frame.command === "CONNECTED") {
          setConnected(true);
          // Collect pre-existing callbacks (meeting room subs etc) before adding conversation subs
          const existingDests = new Set(callbacksRef.current.keys());

          // Auto-subscribe to all user's conversations
          activeConversations.forEach((conv) => {
            const dest = `/topic/chat/${conv.id}`;
            if (!existingDests.has(dest)) {
              callbacksRef.current.set(dest, (msg: any) => {
                if (msg.senderId === userId) return;
                const store = useChatStore.getState();
                store.sendMessage(conv.id, msg.senderId, msg.senderName, msg.content, msg.imageUrl);
              });
            }
          });

          // Subscribe ALL destinations (conversations + other topics) in one pass
          callbacksRef.current.forEach((_, dest) => {
            subIdRef.current++;
            ws.send(encodeFrame("SUBSCRIBE", { id: `sub-${subIdRef.current}`, destination: dest }));
          });
        }

        if (frame.command === "MESSAGE" && frame.headers.destination) {
          const cb = callbacksRef.current.get(frame.headers.destination);
          if (cb && frame.body) {
            try { cb(JSON.parse(frame.body)); } catch { cb(frame.body); }
          }
        }
      };

      ws.onclose = () => {
        setConnected(false);
        retries++;
        if (retries < maxRetries) {
          reconnectTimer = setTimeout(connect, 3000 * retries);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(encodeFrame("DISCONNECT", {}));
      }
      wsRef.current?.close();
      setConnected(false);
    };
  }, [userId]);

  // Subscribe to a topic
  const subscribe = useCallback((destination: string, callback: (msg: any) => void) => {
    callbacksRef.current.set(destination, callback);
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      subIdRef.current++;
      ws.send(encodeFrame("SUBSCRIBE", { id: `sub-${subIdRef.current}`, destination }));
    }
  }, []);

  // Send a STOMP message
  const send = useCallback((destination: string, body: any) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(encodeFrame("SEND", { destination, "content-type": "application/json" }, JSON.stringify(body)));
    }
  }, []);

  // Send chat message (persists locally + broadcasts via WebSocket)
  const sendRealtimeMessage = useCallback((conversationId: string, content: string, imageUrl?: string) => {
    if (!userId || !currentUser) return;

    // Save locally
    sendStoreMessage(conversationId, userId, currentUser.name, content, imageUrl);

    // Broadcast to others
    send(`/app/chat/${conversationId}`, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderId: userId,
      senderName: currentUser.name,
      content,
      imageUrl: imageUrl ?? null,
    });
  }, [userId, currentUser, sendStoreMessage, send]);

  // Meeting-specific methods
  const subscribeMeeting = useCallback((meetingId: string, onMessage: (msg: any) => void, onReaction?: (r: any) => void) => {
    subscribe(`/topic/meeting/${meetingId}/chat`, onMessage);
    if (onReaction) subscribe(`/topic/meeting/${meetingId}/reaction`, onReaction);

    return () => {
      callbacksRef.current.delete(`/topic/meeting/${meetingId}/chat`);
      callbacksRef.current.delete(`/topic/meeting/${meetingId}/reaction`);
    };
  }, [subscribe]);

  const sendMeetingMessage = useCallback((meetingId: string, content: string) => {
    send(`/app/meeting/${meetingId}/chat`, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderId: userId,
      senderName: currentUser?.name ?? "User",
      content,
    });
  }, [userId, currentUser, send]);

  const sendMeetingReaction = useCallback((meetingId: string, emoji: string) => {
    send(`/app/meeting/${meetingId}/reaction`, { userId, emoji });
  }, [userId, send]);

  return (
    <RealtimeContext.Provider value={{ connected, sendRealtimeMessage, subscribeMeeting, sendMeetingMessage, sendMeetingReaction }}>
      {children}
    </RealtimeContext.Provider>
  );
}
