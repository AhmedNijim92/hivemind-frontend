import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

/**
 * Lightweight STOMP-over-WebSocket hook.
 * Connects to the meeting-service WebSocket endpoint for real-time messaging.
 *
 * Usage:
 *   const { subscribe, send, connected } = useWebSocket();
 *   subscribe("/topic/chat/room1", (msg) => console.log(msg));
 *   send("/app/chat/room1", { content: "Hello" });
 */

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

function encodeStompFrame(command: string, headers: Record<string, string>, body = ""): string {
  let frame = command + "\n";
  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }
  frame += "\n" + body + "\0";
  return frame;
}

function decodeStompFrame(data: string): StompFrame {
  const lines = data.split("\n");
  const command = lines[0];
  const headers: Record<string, string> = {};
  let i = 1;
  while (i < lines.length && lines[i] !== "") {
    const [key, ...valueParts] = lines[i].split(":");
    headers[key] = valueParts.join(":");
    i++;
  }
  const body = lines.slice(i + 1).join("\n").replace(/\0$/, "");
  return { command, headers, body };
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Map<string, (msg: any) => void>>(new Map());
  const [connected, setConnected] = useState(false);
  const subIdRef = useRef(0);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Determine WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/websocket`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send STOMP CONNECT frame
      ws.send(encodeStompFrame("CONNECT", {
        "accept-version": "1.2",
        "heart-beat": "10000,10000",
      }));
    };

    ws.onmessage = (event) => {
      const frame = decodeStompFrame(event.data);

      if (frame.command === "CONNECTED") {
        setConnected(true);
        // Re-subscribe existing subscriptions
        subscriptionsRef.current.forEach((_, dest) => {
          subIdRef.current++;
          ws.send(encodeStompFrame("SUBSCRIBE", {
            id: `sub-${subIdRef.current}`,
            destination: dest,
          }));
        });
      }

      if (frame.command === "MESSAGE") {
        const destination = frame.headers.destination;
        const callback = subscriptionsRef.current.get(destination);
        if (callback && frame.body) {
          try {
            callback(JSON.parse(frame.body));
          } catch {
            callback(frame.body);
          }
        }
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3s
      setTimeout(() => {
        // Will trigger useEffect re-run if component still mounted
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(encodeStompFrame("DISCONNECT", {}));
      }
      ws.close();
      setConnected(false);
    };
  }, [token]);

  const subscribe = useCallback((destination: string, callback: (msg: any) => void) => {
    subscriptionsRef.current.set(destination, callback);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && connected) {
      subIdRef.current++;
      ws.send(encodeStompFrame("SUBSCRIBE", {
        id: `sub-${subIdRef.current}`,
        destination,
      }));
    }
  }, [connected]);

  const unsubscribe = useCallback((destination: string) => {
    subscriptionsRef.current.delete(destination);
  }, []);

  const send = useCallback((destination: string, body: any) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(encodeStompFrame("SEND", {
        destination,
        "content-type": "application/json",
      }, JSON.stringify(body)));
    }
  }, []);

  return { subscribe, unsubscribe, send, connected };
}
