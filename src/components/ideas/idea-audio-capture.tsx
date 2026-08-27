"use client";

import { useRef, useState } from "react";
import { Copy, FileAudio, Mic, MicOff, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_RECORDING_MS = 5 * 60 * 1000;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

type CapturePhase = "idle" | "recording" | "transcribing" | "native";

interface AudioDiagnostics {
  stage: "capability" | "permission" | "recording";
  standalone: boolean;
  ios: boolean;
  secureContext: boolean;
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  hasMediaRecorder: boolean;
  permission: string;
  errorName: string | null;
  errorMessage: string | null;
}

function isStandaloneMode(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

function preferredRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const type of ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

async function microphonePermission(): Promise<string> {
  if (!navigator.permissions?.query) return "unsupported";
  try {
    const status = await navigator.permissions.query({ name: "microphone" } as PermissionDescriptor);
    return status.state;
  } catch {
    return "unsupported";
  }
}

async function collectDiagnostics(
  stage: AudioDiagnostics["stage"],
  caught?: unknown,
): Promise<AudioDiagnostics> {
  return {
    stage,
    standalone: isStandaloneMode(),
    ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
    secureContext: window.isSecureContext,
    hasMediaDevices: Boolean(navigator.mediaDevices),
    hasGetUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
    hasMediaRecorder: typeof MediaRecorder !== "undefined",
    permission: await microphonePermission(),
    errorName: caught instanceof DOMException || caught instanceof Error ? caught.name : null,
    errorMessage: caught instanceof Error ? caught.message : null,
  };
}

function normalizedAudioFile(file: File): File {
  if (file.type.startsWith("audio/")) return file;
  const lower = file.name.toLowerCase();
  const type = lower.endsWith(".m4a") || lower.endsWith(".mp4")
    ? "audio/mp4"
    : lower.endsWith(".mp3")
      ? "audio/mpeg"
      : lower.endsWith(".wav")
        ? "audio/wav"
        : lower.endsWith(".caf")
          ? "audio/x-caf"
          : file.type;
  return new File([file], file.name, { type });
}

export function IdeaAudioCapture({
  disabled,
  onTranscript,
  onBusyChange,
}: {
  disabled: boolean;
  onTranscript: (transcript: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [phase, setPhaseState] = useState<CapturePhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<AudioDiagnostics | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function setPhase(next: CapturePhase) {
    setPhaseState(next);
    onBusyChange(next !== "idle");
  }

  function releaseMicrophone(resetPhase = true) {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    if (resetPhase) setPhase("idle");
  }

  async function transcribeFile(rawFile: File) {
    const file = normalizedAudioFile(rawFile);
    if (file.size <= 0) {
      setError("No audio was captured.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("That recording is too large. Keep narration under about five minutes.");
      return;
    }
    if (!file.type.startsWith("audio/")) {
      setError("That file does not look like a supported audio recording.");
      return;
    }

    setPhase("transcribing");
    setError(null);
    setMessage("Turning your recording into editable text…");
    try {
      const form = new FormData();
      form.append("audio", file);
      const response = await fetch("/api/ideas/transcribe", { method: "POST", body: form });
      const result = await response.json() as { ok: boolean; data?: { text?: string }; error?: string };
      if (!response.ok || !result.ok || !result.data?.text?.trim()) {
        throw new Error(result.error ?? "Could not transcribe the recording.");
      }
      onTranscript(result.data.text.trim());
      setMessage("Narration transcribed. Edit anything you want before saving.");
      setDiagnostics(null);
    } catch (caught) {
      setMessage(null);
      setError(caught instanceof Error ? caught.message : "Could not transcribe the recording.");
    } finally {
      setPhase("idle");
    }
  }

  async function startRecording() {
    setError(null);
    setMessage(null);
    setDiagnostics(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      const details = await collectDiagnostics("capability");
      setDiagnostics(details);
      setError(details.standalone && details.ios
        ? "The installed iPhone app is not exposing browser microphone capture. Use Record/choose audio below, or open the native recorder."
        : "This browser does not expose the microphone recording APIs Year Mission needs.");
      return;
    }

    setPhase("recording");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = async () => {
        releaseMicrophone();
        const details = await collectDiagnostics("recording");
        setDiagnostics(details);
        setError("Recording stopped unexpectedly. The diagnostics below show what the browser exposed.");
      };
      recorder.onstop = () => {
        const chunks = chunksRef.current;
        chunksRef.current = [];
        const type = recorder.mimeType || mimeType || "audio/mp4";
        releaseMicrophone(false);
        const blob = new Blob(chunks, { type });
        const extension = type.includes("mp4") ? "m4a" : "webm";
        void transcribeFile(new File([blob], `brain-dump.${extension}`, { type }));
      };

      recorder.start(1000);
      stopTimerRef.current = setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, MAX_RECORDING_MS);
    } catch (caught) {
      releaseMicrophone();
      const details = await collectDiagnostics("permission", caught);
      setDiagnostics(details);
      const denied = caught instanceof DOMException && (caught.name === "NotAllowedError" || caught.name === "SecurityError");
      setError(denied
        ? details.standalone && details.ios
          ? "The installed iPhone app refused microphone access even though Safari may allow it. Use the native recorder below while Year Mission keeps the web path available."
          : "Microphone access is off for this site. Allow microphone access and try again."
        : `Could not start the microphone${details.errorName ? ` (${details.errorName})` : ""}.`);
    }
  }

  function toggleNarration() {
    if (phase === "recording") {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      return;
    }
    void startRecording();
  }

  async function launchNativeRecorder() {
    setPhase("native");
    setError(null);
    setMessage("Opening the native recorder…");
    try {
      const response = await fetch("/api/ideas/native-ticket", { method: "POST" });
      const result = await response.json() as { ok: boolean; data?: { deepLink?: string }; error?: string };
      if (!response.ok || !result.ok || !result.data?.deepLink) {
        throw new Error(result.error ?? "Could not prepare native narration.");
      }
      window.location.href = result.data.deepLink;
      window.setTimeout(() => {
        setPhase("idle");
        setMessage("If the native recorder did not open, reinstall the latest Year Mission native build after its Xcode update.");
      }, 1400);
    } catch (caught) {
      setPhase("idle");
      setMessage(null);
      setError(caught instanceof Error ? caught.message : "Could not open native narration.");
    }
  }

  async function copyDiagnostics() {
    if (!diagnostics) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setMessage("Audio diagnostics copied.");
    } catch {
      setMessage("Audio diagnostics are shown below.");
    }
  }

  const recording = phase === "recording";
  const transcribing = phase === "transcribing";
  const busy = phase !== "idle";

  return (
    <div className="mt-3 flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        capture="user"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void transcribeFile(file);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={recording ? "secondary" : "ghost"} onClick={toggleNarration} disabled={disabled || (busy && !recording)}>
          {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {recording ? "Stop & transcribe" : transcribing ? "Transcribing…" : "Narrate"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={disabled || busy}>
          <FileAudio className="h-4 w-4" />
          Record/choose audio
        </Button>
        {diagnostics?.standalone && diagnostics.ios && (
          <Button type="button" variant="secondary" onClick={() => void launchNativeRecorder()} disabled={disabled || busy}>
            <Smartphone className="h-4 w-4" />
            Native recorder
          </Button>
        )}
      </div>

      {recording && <p className="text-xs text-violet-300">Recording… speak naturally, then tap Stop & transcribe. Maximum five minutes.</p>}
      {transcribing && <p className="text-xs text-violet-300">Turning your recording into editable text…</p>}
      {message && <p className="text-xs leading-relaxed text-emerald-400">{message}</p>}
      {error && <p className="text-xs leading-relaxed text-amber-300">{error}</p>}

      {diagnostics && (
        <details className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-2 text-[11px] text-zinc-500">
          <summary className="cursor-pointer font-medium text-zinc-400">Microphone diagnostics</summary>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            <span>Standalone PWA</span><span>{String(diagnostics.standalone)}</span>
            <span>iOS</span><span>{String(diagnostics.ios)}</span>
            <span>Secure context</span><span>{String(diagnostics.secureContext)}</span>
            <span>mediaDevices</span><span>{String(diagnostics.hasMediaDevices)}</span>
            <span>getUserMedia</span><span>{String(diagnostics.hasGetUserMedia)}</span>
            <span>MediaRecorder</span><span>{String(diagnostics.hasMediaRecorder)}</span>
            <span>Permission API</span><span>{diagnostics.permission}</span>
            <span>Error</span><span>{diagnostics.errorName ?? "none"}</span>
          </div>
          <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => void copyDiagnostics()}>
            <Copy className="h-3.5 w-3.5" />
            Copy diagnostics
          </Button>
        </details>
      )}
    </div>
  );
}
