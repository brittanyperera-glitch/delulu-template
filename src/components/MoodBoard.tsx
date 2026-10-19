"use client";
import { useState, useTransition } from "react";
import { happenedAction } from "@/actions/spoilers";
import { SkinPicker } from "@/components/SkinPicker";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import type { Skin, Spoiler } from "@/lib/db/schema";

/** One shared board: any tile can be flipped by whoever is looking at it. */
export function MoodBoard({
  spoilers,
  skins,
  initialSkinId,
}: {
  spoilers: Spoiler[];
  skins: Skin[];
  initialSkinId: number | null;
}) {
  const [open, setOpen] = useState<Spoiler | null>(null);
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const [pending, start] = useTransition();
  return (
    <>
      {/* Two columns of varied heights: a collage, not a grid of equal boxes. */}
      <div className="[column-count:2] [column-gap:12px]">
        {spoilers.map((s) => (
          <figure
            key={s.id}
            className="mb-3 break-inside-avoid rounded-card border-[3px] border-brown bg-card p-2 shadow-hard"
          >
            {/* biome-ignore lint/performance/noImgElement: a remote Blob URL, deliberately unoptimised */}
            <img
              src={s.imageUrl}
              alt="Pinned spoiler"
              className="w-full rounded-[10px] border-2 border-brown"
            />
            {s.line ? (
              <figcaption className="font-display px-1 pt-2 text-base leading-tight text-brown">
                {s.line}
              </figcaption>
            ) : null}
            <div className="flex flex-row items-center justify-between gap-2 px-1 pt-2">
              {s.happenedDay !== null ? (
                <Pill tone="avocado">{STRINGS.spoilers.stamp}</Pill>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(s)}
                  className="label text-brown underline"
                >
                  {STRINGS.spoilers.cta}
                </button>
              )}
            </div>
          </figure>
        ))}
      </div>
      <Sheet open={open !== null} onClose={() => setOpen(null)}>
        {open ? (
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-2xl text-brown">{STRINGS.spoilers.cta}</h2>
            {/* biome-ignore lint/performance/noImgElement: a remote Blob URL, deliberately unoptimised */}
            <img
              src={open.imageUrl}
              alt="Pinned spoiler"
              className="w-full rounded-[10px] border-2 border-brown"
            />
            <SkinPicker skins={skins} selectedId={skinId} onSelect={setSkinId} />
            <Button
              kind="primary"
              disabled={pending || skinId === null}
              onClick={() =>
                start(async () => {
                  if (skinId) await happenedAction({ id: open.id, skinId });
                  setOpen(null);
                })
              }
            >
              {STRINGS.spoilers.post}
            </Button>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
