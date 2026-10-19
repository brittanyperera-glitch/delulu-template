"use client";
import { useState, useTransition } from "react";
import { approveTrackAction } from "@/actions/tracks";
import { useMembers } from "@/components/MembersProvider";
import { TrackComments } from "@/components/TrackComments";
import { STRINGS } from "@/lib/content/strings";
import type { Track } from "@/lib/db/schema";
import { type MemberId, nameOf, othersOf } from "@/lib/members";
import type { TrackCommentThread } from "@/lib/repo/track-comments";

/**
 * The Mixtape: the whole playlist, every track in the order it was added, in a Spotify-style
 * dark green/black list. Approved tracks stay here (they carry a green left-edge bar) alongside
 * the ones still waiting on the other person. Tapping a row's album cover flips it to a record
 * label and reveals the comment thread and, for a pending track the other person added, the
 * promote button. The quick thumbs-up stays on the front so promoting is one tap.
 */
export function Mixtape({
  tracks,
  me,
  commentsByTrack = {},
}: {
  tracks: Track[];
  me: MemberId;
  commentsByTrack?: Record<number, TrackCommentThread[]>;
}) {
  return (
    <div className="rounded-card bg-mixtape-bg p-2 sm:p-3">
      {tracks.length === 0 ? (
        <p className="px-2 py-4 font-body text-mixtape-muted">{STRINGS.soundtrack.noTracks}</p>
      ) : (
        <ol className="flex flex-col">
          {tracks.map((t) => (
            <MixtapeRow key={t.id} track={t} me={me} comments={commentsByTrack[t.id] ?? []} />
          ))}
        </ol>
      )}
    </div>
  );
}

function MixtapeRow({
  track,
  me,
  comments,
}: {
  track: Track;
  me: MemberId;
  comments: TrackCommentThread[];
}) {
  const members = useMembers();
  const [flipped, setFlipped] = useState(false);
  const mine = track.author === me;
  const approved = track.approvedAt !== null;
  return (
    <li
      className={`border-b border-l-4 border-mixtape-line/70 last:border-b-0 ${approved ? "border-l-spotify" : "border-l-transparent"}`}
    >
      <div className="flex flex-row items-center gap-3 py-2.5 pr-1 pl-2">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={STRINGS.soundtrack.flipCover}
          aria-expanded={flipped}
          className="shrink-0 [perspective:600px]"
        >
          <span
            className={`relative block h-14 w-14 transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
          >
            {/* Front: the album art (or a blank sleeve when a link carried none). */}
            <span className="absolute inset-0 overflow-hidden rounded-md bg-mixtape-card [backface-visibility:hidden]">
              {track.artUrl ? (
                // biome-ignore lint/performance/noImgElement: a remote Blob URL, deliberately unoptimised
                <img src={track.artUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </span>
            {/* Back: a little record label, so flipping reads as turning the sleeve over. */}
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span className="h-4 w-4 rounded-full border-2 border-black bg-spotify" />
            </span>
          </span>
        </button>
        <a href={track.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
          <span className="block truncate font-body font-semibold text-mixtape-ink">
            {track.title}
          </span>
          <span className="block truncate font-body text-sm text-mixtape-muted">
            {track.artist ? `${track.artist} · ` : ""}
            {nameOf(members, track.author)} · {STRINGS.soundtrack.day(track.day)}
          </span>
        </a>
        {approved ? (
          // The green edge bar is the marker; name it for a screen reader since colour is not enough.
          <span className="sr-only">{STRINGS.soundtrack.onTheRecord}</span>
        ) : mine ? (
          <span className="label shrink-0 text-right text-mixtape-muted">
            {STRINGS.wall.waitingOn(othersOf(members, track.author).map((m) => m.name))}
          </span>
        ) : (
          <ApproveButton id={track.id} />
        )}
      </div>
      {flipped ? (
        <div className="flex flex-col gap-3 px-1 pb-3">
          <TrackComments trackId={track.id} comments={comments} me={me} tone="dark" />
          {!approved && !mine ? <ApproveButton id={track.id} wide /> : null}
        </div>
      ) : null}
    </li>
  );
}

/** The other person's promote control. Green Spotify circle on the front, a full bar on the back. */
function ApproveButton({ id, wide = false }: { id: number; wide?: boolean }) {
  const [pending, start] = useTransition();
  const onClick = () => start(() => approveTrackAction(id));
  if (wide)
    return (
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="label flex h-11 w-full items-center justify-center gap-2 rounded-full bg-spotify text-black disabled:opacity-40"
      >
        <ThumbsUpIcon />
        {STRINGS.soundtrack.approve}
      </button>
    );
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={STRINGS.soundtrack.approve}
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spotify text-black disabled:opacity-40"
    >
      <ThumbsUpIcon />
    </button>
  );
}

function ThumbsUpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3z" />
      <path d="M7 11l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 1.94 2.49l-1.5 6A2 2 0 0 1 17 20H7" />
    </svg>
  );
}
