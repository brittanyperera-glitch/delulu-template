"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { STRINGS } from "@/lib/content/strings";

type Props = {
  kind: "voice" | "video";
  maxSeconds: number;
  onDone: (blob: Blob, seconds: number) => void;
};

export function Recorder({ kind, maxSeconds, onDone }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "voice" ? { audio: true } : { audio: true, video: { facingMode: "user" } },
      );
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      r.onstop = () => {
        for (const t of stream.getTracks()) t.stop();
        const seconds = Math.min(maxSeconds, Math.round((Date.now() - startedAt.current) / 1000));
        onDone(
          new Blob(chunks.current, {
            type: r.mimeType || (kind === "voice" ? "audio/webm" : "video/webm"),
          }),
          seconds,
        );
        setRecording(false);
      };
      rec.current = r;
      startedAt.current = Date.now();
      r.start();
      setRecording(true);
      setElapsed(0);
      timer.current = setInterval(() => {
        const s = Math.round((Date.now() - startedAt.current) / 1000);
        setElapsed(s);
        if (s >= maxSeconds) stop();
      }, 250);
    } catch {
      setError(STRINGS.composer.noMic);
    }
  }

  const mm = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        type="button"
        aria-label={recording ? STRINGS.composer.stop : STRINGS.composer.record}
        onClick={recording ? stop : start}
        className={`h-20 w-20 rounded-full border-[3px] border-brown shadow-hard-sm ${recording ? "bg-brown" : "bg-orange"}`}
      >
        <span
          className={`block mx-auto ${recording ? "h-6 w-6 bg-cream" : "h-8 w-8 rounded-full bg-cream"}`}
        />
      </button>
      <span className="label text-muted">
        {mm(elapsed)} / {mm(maxSeconds)}
      </span>
      {error ? <p className="font-body text-rust text-sm">{error}</p> : null}
      {!recording && !error ? (
        <Button kind="ghost" onClick={start}>
          {STRINGS.composer.record}
        </Button>
      ) : null}
    </div>
  );
}
