"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Pause, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, durationMs: number) => void;
  className?: string;
}

/**
 * Voice message recorder — hold-to-record UX with waveform preview.
 */
export function VoiceRecorder({ onSend, className }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setRecording(true);
      setAudioBlob(null);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current);
      }, 100);
    } catch {
      // Mic permission denied — silently ignore
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [recording]);

  const cancelRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setPlaying(false);
  }, []);

  const handleSend = useCallback(() => {
    if (audioBlob) {
      onSend(audioBlob, duration);
      setAudioBlob(null);
      setDuration(0);
    }
  }, [audioBlob, duration, onSend]);

  const togglePlayback = useCallback(() => {
    if (!audioBlob) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play();
      setPlaying(true);
    }
  }, [audioBlob, playing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioRef.current?.pause();
    };
  }, []);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AnimatePresence mode="wait">
        {audioBlob ? (
          /* Preview mode */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5"
          >
            <button onClick={cancelRecording} className="p-1 text-red-400 hover:text-red-500 transition-colors" aria-label="Discard">
              <Trash2 className="h-4 w-4" />
            </button>

            <button onClick={togglePlayback} className="p-1.5 rounded-full bg-brand-500 text-white" aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>

            {/* Waveform placeholder */}
            <div className="flex items-center gap-[2px] h-5">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] rounded-full bg-brand-400"
                  initial={{ height: 4 }}
                  animate={{
                    height: playing
                      ? [4, 8 + Math.random() * 12, 4]
                      : 4 + Math.sin(i * 0.8) * 6 + Math.random() * 4,
                  }}
                  transition={playing ? { duration: 0.4, repeat: Infinity, delay: i * 0.02 } : { duration: 0 }}
                />
              ))}
            </div>

            <span className="text-xs text-gray-500 min-w-[36px] text-right">{formatDuration(duration)}</span>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              className="p-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white transition-colors"
              aria-label="Send voice message"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        ) : recording ? (
          /* Recording mode */
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 rounded-full px-3 py-1.5 border border-red-200 dark:border-red-800/30"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-red-500"
            />
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">{formatDuration(duration)}</span>

            {/* Live waveform */}
            <div className="flex items-center gap-[2px] h-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] rounded-full bg-red-400"
                  animate={{ height: [4, 8 + Math.random() * 10, 4] }}
                  transition={{ duration: 0.5 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={stopRecording}
              className="p-1.5 rounded-full bg-red-500 text-white"
              aria-label="Stop recording"
            >
              <Square className="h-3 w-3" fill="currentColor" />
            </motion.button>
          </motion.div>
        ) : (
          /* Idle — record button */
          <motion.button
            key="idle"
            whileTap={{ scale: 0.85 }}
            onClick={startRecording}
            className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
            aria-label="Record voice message"
          >
            <Mic className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

interface VoiceMessagePlayerProps {
  /** Duration in milliseconds */
  durationMs: number;
  audioUrl?: string;
  isSent: boolean;
}

/**
 * Voice message playback display inside a message bubble.
 */
export function VoiceMessagePlayer({ durationMs, audioUrl, isSent }: VoiceMessagePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!audioUrl) return;
    if (playing) {
      audioRef.current?.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); setProgress(0); };
      audio.ontimeupdate = () => {
        if (audio.duration) setProgress(audio.currentTime / audio.duration);
      };
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <button onClick={togglePlay} className={cn(
        "p-1.5 rounded-full flex-shrink-0",
        isSent ? "bg-white/20 text-white" : "bg-brand-500/10 text-brand-500"
      )} aria-label={playing ? "Pause" : "Play"}>
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>

      {/* Waveform bars */}
      <div className="flex items-center gap-[2px] flex-1 h-5">
        {Array.from({ length: 24 }).map((_, i) => {
          const barProgress = i / 24;
          const isActive = barProgress <= progress;
          return (
            <div
              key={i}
              className={cn(
                "w-[2px] rounded-full transition-colors duration-150",
                isActive
                  ? isSent ? "bg-white" : "bg-brand-500"
                  : isSent ? "bg-white/30" : "bg-gray-300 dark:bg-gray-600"
              )}
              style={{ height: `${4 + Math.sin(i * 0.7) * 6 + Math.abs(Math.cos(i * 1.3)) * 6}px` }}
            />
          );
        })}
      </div>

      <span className={cn("text-[10px] min-w-[32px]", isSent ? "text-white/60" : "text-gray-400")}>
        {formatDuration(durationMs)}
      </span>
    </div>
  );
}
