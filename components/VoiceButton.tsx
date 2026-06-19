"use client";

import { useRef, useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "recording" | "transcribing";

// Voice-activity-detection tuning.
const SPEAK_THRESHOLD = 0.03; // normalised RMS above which we count as speech
const SILENCE_MS = 1500; // stop after this much silence once the user has spoken
const MAX_MS = 20000; // hard cap on a single recording

/**
 * Press-to-talk voice input with automatic stop. The user taps once to start;
 * we monitor the mic level and automatically stop ~1.5s after they finish
 * speaking, then transcribe via Groq Whisper and return the text. No second tap
 * is needed (tapping again still cancels/stops as a fallback).
 */
export function VoiceButton({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  // VAD state
  const hasSpokenRef = useRef(false);
  const lastSoundRef = useRef(0);
  const startTimeRef = useRef(0);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        cleanup();
        await sendForTranscription(blob);
      };

      recorder.start();
      recorderRef.current = recorder;

      // Set up audio analysis for silence detection.
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.fftSize);
      hasSpokenRef.current = false;
      startTimeRef.current = performance.now();
      lastSoundRef.current = performance.now();
      setStatus("recording");

      const monitor = () => {
        analyser.getByteTimeDomainData(buffer);
        // Root-mean-square volume, normalised to roughly [0, 1].
        let sumSq = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / buffer.length);
        const now = performance.now();

        if (rms > SPEAK_THRESHOLD) {
          hasSpokenRef.current = true;
          lastSoundRef.current = now;
        }

        const silentLongEnough =
          hasSpokenRef.current && now - lastSoundRef.current > SILENCE_MS;
        const tooLong = now - startTimeRef.current > MAX_MS;

        if (silentLongEnough || tooLong) {
          stop();
          return;
        }
        rafRef.current = requestAnimationFrame(monitor);
      };
      rafRef.current = requestAnimationFrame(monitor);
    } catch (err) {
      console.error("[voice] mic error:", err);
      alert("Couldn't access the microphone. Please grant permission and try again.");
      cleanup();
      setStatus("idle");
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setStatus("transcribing");
    try {
      recorderRef.current?.stop(); // triggers onstop -> transcription
    } catch {
      /* ignore */
    }
  }

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }

  async function sendForTranscription(blob: Blob) {
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string };
      if (data.text) onTranscript(data.text);
    } catch (err) {
      console.error("[voice] transcription error:", err);
    } finally {
      setStatus("idle");
    }
  }

  const isRecording = status === "recording";
  const isTranscribing = status === "transcribing";

  return (
    <button
      type="button"
      onClick={isRecording ? stop : start}
      disabled={disabled || isTranscribing}
      aria-label={isRecording ? "Listening… tap to stop" : "Record voice"}
      title={isRecording ? "Listening… (auto-stops when you finish)" : "Voice input"}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
        isRecording
          ? "bg-red-500/15 text-red-500"
          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
        (disabled || isTranscribing) && "opacity-50",
      )}
    >
      {isTranscribing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <span className="relative grid place-items-center">
          <span className="absolute h-5 w-5 animate-ping rounded-full bg-red-500/40" />
          <Mic className="h-5 w-5" />
        </span>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}
