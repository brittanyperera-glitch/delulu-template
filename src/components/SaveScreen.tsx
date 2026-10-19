"use client";
import Link from "next/link";
import { useTransition } from "react";
import { openCheckpointAction } from "@/actions/checkpoints";
import { Button } from "@/components/ui/Button";
import { STRINGS } from "@/lib/content/strings";
import type { Checkpoint, JarItem } from "@/lib/db/schema";

function OpenRow({ id, day }: { id: number; day: number }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3 rounded-card border-[3px] border-brown bg-mustard p-5 shadow-hard">
      <span className="font-display text-2xl text-brown">{STRINGS.checkpoints.card(day)}</span>
      <Button
        kind="primary"
        className="self-start"
        disabled={pending}
        onClick={() => start(() => openCheckpointAction(id))}
      >
        {STRINGS.checkpoints.open}
      </Button>
    </div>
  );
}

function Opened({ checkpoint, feral }: { checkpoint: Checkpoint; feral: JarItem | null }) {
  if (!checkpoint.recapJson) return null;
  const recap = checkpoint.recapJson;
  return (
    <div className="flex flex-col gap-4 rounded-card border-[3px] border-brown bg-brown p-6 font-mono text-cream shadow-hard">
      <div className="flex flex-row items-baseline justify-between">
        <span className="label text-mustard">{STRINGS.checkpoints.saved}</span>
        <span className="font-display text-5xl leading-none text-orange">{checkpoint.day}</span>
      </div>
      <p className="text-[13px] uppercase tracking-wide">
        {STRINGS.checkpoints.tally(
          recap.posts,
          recap.trululus,
          recap.ws,
          recap.ls,
          recap.skinsUsed,
        )}
      </p>
      {recap.topPostId !== null ? (
        <Link href={`/post/${recap.topPostId}`} className="label text-rust underline normal-case">
          {STRINGS.checkpoints.topPost}
        </Link>
      ) : null}
      <div className="flex flex-col gap-2 border-t-2 border-dashed border-cream/30 pt-4">
        <span className="label text-mustard">{STRINGS.checkpoints.bonus}</span>
        {feral ? (
          <p className="text-sm normal-case leading-snug break-words">{feral.body}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm normal-case leading-snug text-cream/70">
              {STRINGS.checkpoints.emptyFeral}
            </p>
            <Link href="/jar" className="label text-rust underline">
              {STRINGS.checkpoints.addFeral}
            </Link>
          </div>
        )}
      </div>
      <span className="label text-cream/50">
        {STRINGS.checkpoints.continueLabel}
        <span aria-hidden="true" className="animate-pulse">
          _
        </span>
      </span>
    </div>
  );
}

export function SaveScreen({
  views,
}: {
  views: { checkpoint: Checkpoint; feral: JarItem | null }[];
}) {
  if (views.length === 0)
    return <p className="font-display text-2xl text-brown">{STRINGS.checkpoints.none}</p>;
  return (
    <ul className="flex flex-col gap-6">
      {views.map((v) => (
        <li key={v.checkpoint.id}>
          {v.checkpoint.postId === null ? (
            <OpenRow id={v.checkpoint.id} day={v.checkpoint.day} />
          ) : (
            <Opened checkpoint={v.checkpoint} feral={v.feral} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function CheckpointCard({ id, day }: { id: number; day: number }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-row items-center justify-between gap-3 rounded-card border-[3px] border-brown bg-mustard px-4 py-3 shadow-hard">
      <span className="label text-brown">{STRINGS.checkpoints.card(day)}</span>
      <Button kind="ghost" disabled={pending} onClick={() => start(() => openCheckpointAction(id))}>
        {STRINGS.checkpoints.open}
      </Button>
    </div>
  );
}
