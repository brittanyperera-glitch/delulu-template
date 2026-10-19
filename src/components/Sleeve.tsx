"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { TrackComments } from "@/components/TrackComments";
import { STRINGS } from "@/lib/content/strings";
import type { Track } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";
import type { TrackCommentThread } from "@/lib/repo/track-comments";

const SWIPE_THRESHOLD_PX = 40;

/**
 * A gatefold sleeve with the record peeking out: one approved track at a time, flipped
 * through by button, swipe or the arrow keys. The frame and disc always render (even with
 * nothing approved yet) so the shelf never looks broken, only empty.
 */
export function Sleeve({
  tracks,
  me,
  commentsByTrack = {},
}: {
  tracks: Track[];
  me: MemberId;
  commentsByTrack?: Record<number, TrackCommentThread[]>;
}) {
  const count = tracks.length;
  const [index, setIndex] = useState(0);
  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);
  const current = count > 0 ? tracks[safeIndex] : null;
  const touchX = useRef<number | null>(null);

  const move = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // Never steal the arrow keys from a text field (the add-track sheet's link input, say).
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative w-full max-w-[320px] overflow-hidden"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx > SWIPE_THRESHOLD_PX) move(-1);
          else if (dx < -SWIPE_THRESHOLD_PX) move(1);
          touchX.current = null;
        }}
      >
        <div className="absolute right-0 top-1/2 h-[240px] w-[240px] -translate-y-1/2 translate-x-16 rounded-full border-[3px] border-brown bg-brown">
          <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brown bg-mustard" />
        </div>
        <div className="relative aspect-square w-[280px] overflow-hidden rounded-card border-[3px] border-brown bg-surface shadow-hard">
          {current?.artUrl ? (
            // biome-ignore lint/performance/noImgElement: a remote Blob URL, deliberately unoptimised
            <img src={current.artUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <span className="label absolute bottom-3 left-3 rounded-full border-2 border-brown bg-cream px-2 py-1 text-brown">
            {STRINGS.soundtrack.side}
          </span>
        </div>
      </div>
      {current ? (
        <div className="flex flex-col gap-1">
          <span className="font-body font-bold text-brown">{current.title}</span>
          {current.artist ? <span className="font-body text-ink">{current.artist}</span> : null}
        </div>
      ) : (
        <p className="font-display text-2xl text-brown">{STRINGS.soundtrack.noneApproved}</p>
      )}
      {count > 1 ? (
        <div className="flex flex-row items-center gap-4">
          <button
            type="button"
            aria-label={STRINGS.soundtrack.flipPrev}
            onClick={() => move(-1)}
            className="label flex h-9 w-9 items-center justify-center rounded-full border-2 border-brown text-brown"
          >
            {"‹"}
          </button>
          <span className="label text-muted">
            {STRINGS.soundtrack.position(safeIndex + 1, count)}
          </span>
          <button
            type="button"
            aria-label={STRINGS.soundtrack.flipNext}
            onClick={() => move(1)}
            className="label flex h-9 w-9 items-center justify-center rounded-full border-2 border-brown text-brown"
          >
            {"›"}
          </button>
        </div>
      ) : null}
      {current ? (
        <TrackComments trackId={current.id} comments={commentsByTrack[current.id] ?? []} me={me} />
      ) : null}
    </div>
  );
}
