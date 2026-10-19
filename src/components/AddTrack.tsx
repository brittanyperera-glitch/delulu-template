"use client";
import { useState, useTransition } from "react";
import { addTrackAction } from "@/actions/tracks";
import { SkinPicker } from "@/components/SkinPicker";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import type { Skin } from "@/lib/db/schema";

export function AddTrack({
  skins,
  initialSkinId,
  tone = "paper",
}: {
  skins: Skin[];
  initialSkinId: number | null;
  /** Themes the trigger button with the page; the sheet stays paper. */
  tone?: "paper" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [toWall, setToWall] = useState(false);
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const [pending, start] = useTransition();
  return (
    <>
      <Button kind="primary" tone={tone} className="self-start" onClick={() => setOpen(true)}>
        {STRINGS.soundtrack.cta}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown">{STRINGS.soundtrack.cta}</h2>
          <Field
            placeholder={STRINGS.soundtrack.placeholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setToWall((v) => !v)}
            aria-pressed={toWall}
            className="label self-start text-brown underline"
          >
            {toWall ? STRINGS.soundtrack.wallOn : STRINGS.soundtrack.wallOff}
          </button>
          {toWall ? (
            <SkinPicker
              skins={skins}
              selectedId={skinId}
              onSelect={setSkinId}
              onNew={() => setToWall(false)}
            />
          ) : null}
          <Button
            kind="primary"
            disabled={pending || url.trim().length === 0 || (toWall && skinId === null)}
            onClick={() =>
              start(async () => {
                await addTrackAction({ url, skinId: toWall && skinId ? skinId : undefined });
                setUrl("");
                setOpen(false);
              })
            }
          >
            {STRINGS.soundtrack.add}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
