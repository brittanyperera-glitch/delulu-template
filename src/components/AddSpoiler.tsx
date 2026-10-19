"use client";
import { useRef, useState, useTransition } from "react";
import { addSpoilerAction } from "@/actions/spoilers";
import { SkinPicker } from "@/components/SkinPicker";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import type { Skin } from "@/lib/db/schema";
import { SPOILER_LINE_MAX } from "@/lib/repo/spoilers";
import { validateMedia } from "@/lib/upload";
import { uploadMedia } from "@/lib/upload-client";

export function AddSpoiler({
  skins,
  initialSkinId,
}: {
  skins: Skin[];
  initialSkinId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [line, setLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Optional: a tile with no skin is the normal case, so nothing here is disabled by it.
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button kind="primary" className="self-start" onClick={() => setOpen(true)}>
        {STRINGS.spoilers.add}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown">{STRINGS.spoilers.add}</h2>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="label"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const bad = validateMedia("photo", file.type);
              if (bad) {
                setError(bad);
                return;
              }
              setError(null);
              const up = await uploadMedia(file, "photo");
              setUrl(up.url);
            }}
          />
          {url ? (
            // biome-ignore lint/performance/noImgElement: a remote Blob URL, deliberately unoptimised
            <img
              src={url}
              alt="Preview of your upload"
              className="w-full rounded-[10px] border-2 border-brown"
            />
          ) : null}
          {error ? <p className="label text-rust">{error}</p> : null}
          <Field
            placeholder={STRINGS.spoilers.placeholder}
            value={line}
            onChange={(e) => setLine(e.target.value)}
            maxLength={SPOILER_LINE_MAX}
          />
          <span className="label text-muted">{STRINGS.spoilers.skin}</span>
          <SkinPicker
            skins={skins}
            selectedId={skinId}
            onSelect={(id) => setSkinId(skinId === id ? null : id)}
          />
          <Button
            kind="primary"
            disabled={pending || url === null}
            onClick={() =>
              start(async () => {
                if (!url) return;
                await addSpoilerAction({
                  imageUrl: url,
                  line: line || undefined,
                  skinId: skinId ?? undefined,
                });
                setUrl(null);
                setLine("");
                setOpen(false);
              })
            }
          >
            {STRINGS.spoilers.pin}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
