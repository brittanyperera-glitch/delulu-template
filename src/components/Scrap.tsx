import Link from "next/link";
import type { ReactNode } from "react";
import { ScrapShell } from "@/components/ScrapShell";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import { type MemberId, type MembersMap, nameOf } from "@/lib/members";
import { type BombView, bombFuseLine } from "@/lib/repo/bombs";
import { tiltFor, type WallItem } from "@/lib/repo/posts";
import { TERM } from "@/lib/terminal";
import { ScrapMedia } from "./ScrapMedia";

export const STAMP_TONE: Record<string, PillTone> = {
  W: "orange",
  L: "rust",
  TRULULU: "mustard",
};

// Half the width of a full scrap and a touch smaller (p-2.5 vs a card's p-3), on both the
// detonated bomb below and the still-ticking one: a sealed note reads as a note, not a post.
const BOMB_CARD = "block w-1/2 max-w-xs self-start";

export function Scrap({
  item,
  me,
  members,
  large = false,
}: {
  item: WallItem;
  me: MemberId;
  members: MembersMap;
  large?: boolean;
}) {
  const { post } = item;
  // A time bomb never shows its words on the shared wall: the note is read in the Time Bombs
  // room, not spoiled to whoever scrolls past. The wall shows only that one is sealed and whose.
  if (post.source === "bomb") {
    return (
      <Link href="/bombs" className={BOMB_CARD}>
        <SealedBomb post={post} me={me} members={members} large={large} />
      </Link>
    );
  }
  return large ? (
    <Body item={item} members={members} large />
  ) : (
    <Link href={`/post/${post.id}`} className="block">
      <Body item={item} members={members} />
    </Link>
  );
}

/** The shared shell for a bomb note: dark terminal card, pulsing dot, sealed label, never the words. */
function BombNote({
  mine,
  fromName,
  tilt,
  footer,
}: {
  mine: boolean;
  fromName: string;
  tilt?: number;
  footer: ReactNode;
}) {
  return (
    <div
      className={`rounded-card border-[3px] border-brown shadow-hard flex flex-col gap-2 p-2.5 ${TERM.ground} ${TERM.green}`}
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      <div className="flex flex-row items-center justify-between">
        <span className="label tracking-widest">{STRINGS.bombs.wallLabel}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${TERM.fuse} animate-pulse`} />
      </div>
      <p className="font-display text-sm leading-snug">
        {mine ? STRINGS.bombs.wallSent : STRINGS.bombs.wallFrom(fromName)}
      </p>
      {footer}
    </div>
  );
}

function SealedBomb({
  post,
  me,
  members,
  large,
}: {
  post: WallItem["post"];
  me: MemberId;
  members: MembersMap;
  large?: boolean;
}) {
  const mine = post.author === me;
  return (
    <BombNote
      mine={mine}
      fromName={nameOf(members, post.author)}
      tilt={large ? 0 : tiltFor(post)}
      footer={<span className={`label ${TERM.dim}`}>Day {post.day}</span>}
    />
  );
}

/**
 * A bomb still counting down, on the wall itself rather than only the sidebar tray. `mine`
 * comes straight off BombView (sender === viewer): the sender reads "you've sent one", the
 * recipient reads "a sealed note from <sender>". Same sealed language as the detonated card,
 * with the fuse in place of the day it went off, so it reads as ticking rather than gone.
 */
export function TickingBombCard({ bomb, members }: { bomb: BombView; members: MembersMap }) {
  const { detail, bar } = bombFuseLine(bomb.fuse);
  return (
    <Link href="/bombs" className={BOMB_CARD}>
      <BombNote
        mine={bomb.mine}
        fromName={nameOf(members, bomb.sender)}
        footer={
          <div className="flex flex-col gap-1">
            <span className={`label-asis ${TERM.dim}`}>{detail}</span>
            {bar === null ? null : (
              <div className={`h-1.5 w-full border-2 ${TERM.hair}`}>
                <div className="h-full bg-rust" style={{ width: `${bar}%` }} />
              </div>
            )}
          </div>
        }
      />
    </Link>
  );
}

function Body({
  item,
  members,
  large = false,
}: {
  item: WallItem;
  members: MembersMap;
  large?: boolean;
}) {
  const { post } = item;
  // Newest last (decorate orders ascending), so the peek is whatever was said most recently.
  const latestComment = item.comments.at(-1);
  return (
    <ScrapShell post={post} skin={item.skin} tilt={large ? 0 : tiltFor(post)}>
      {post.type === "text" ? (
        <p
          className={`font-body font-bold leading-snug whitespace-pre-line ${large ? "text-lg" : "text-base line-clamp-6"}`}
        >
          {post.body}
        </p>
      ) : (
        <ScrapMedia post={post} members={members} large={large} interactive={large} />
      )}
      {post.type !== "text" && post.body ? (
        <p className="font-display text-base leading-snug">{post.body}</p>
      ) : null}
      <div className="flex flex-row items-center justify-between gap-2">
        {/* The skin names itself here, which is the only place it appears on the wall in
            words. min-w-0 and truncate keep a long name from pushing the stamps off. */}
        <span className="label min-w-0 truncate opacity-70">
          {nameOf(members, post.author)} · Day {post.day} · {item.skin.name}
        </span>
        <div className="flex flex-row gap-1.5">
          {post.stamps.map((s) => (
            <Pill key={s} tone={STAMP_TONE[s] ?? "cream"}>
              {STRINGS.stamps[s] ?? s}
            </Pill>
          ))}
        </div>
      </div>
      {!large ? (
        <>
          {/* A peek, not the thread: one truncated line, the full conversation is a tap away. */}
          {latestComment ? (
            <p className="font-body truncate text-sm text-muted">
              <span className="font-bold">{nameOf(members, latestComment.author)}</span>:{" "}
              {latestComment.body}
            </p>
          ) : null}
          <div className="flex flex-row items-center gap-2 label opacity-60">
            {item.reactions.length > 0 ? (
              <span>{[...new Set(item.reactions.map((r) => r.word))].join(" · ")}</span>
            ) : null}
            {item.commentCount > 0 ? (
              <span className="ml-auto rounded-full border-2 border-current px-2 py-0.5">
                {item.commentCount}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </ScrapShell>
  );
}
