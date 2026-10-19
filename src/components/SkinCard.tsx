"use client";
import { useState } from "react";
import { useMembers } from "@/components/MembersProvider";
import { NewSkinSheet } from "@/components/NewSkinSheet";
import { skinFill } from "@/components/SkinBadge";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Skin } from "@/lib/db/schema";
import { colourOf, initialOf } from "@/lib/members";

/**
 * A card is not worn, it is used: `used` is the number of posts carrying this skin.
 *
 * `editable` is decided server-side (the page checks `skin.owner === player`), the same way
 * post/[id]/page.tsx only renders OwnerControls for the author: a non-owner never gets the
 * control in the tree at all, not just a hidden one.
 */
export function SkinCard({
  skin,
  used,
  tilt,
  editable = false,
}: {
  skin: Skin;
  used: number;
  tilt: number;
  editable?: boolean;
}) {
  const members = useMembers();
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const initial = skin.name.trim().charAt(0).toUpperCase();
  return (
    <div
      data-testid={`skin-card-${skin.id}`}
      className="shrink-0"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <button
        type="button"
        aria-label={skin.name}
        aria-pressed={flipped}
        onClick={() => setFlipped((f) => !f)}
        className={`relative block h-[210px] w-[150px] overflow-hidden rounded-card border-[3px] border-brown shadow-hard text-left ${
          flipped ? "bg-card" : skinFill(skin)
        }`}
      >
        <span className="label absolute right-2 top-2 rounded-full border-2 border-brown bg-cream px-2 py-0.5 text-brown">
          {STRINGS.skins.used(used)}
        </span>
        {flipped ? (
          <span className="flex h-full flex-col justify-end gap-2 p-3">
            <span className="font-body text-sm leading-snug text-ink">
              {skin.line ?? STRINGS.skins.noLine}
            </span>
            <span className="label text-muted">{skin.name}</span>
          </span>
        ) : (
          <span className="flex h-full flex-col justify-between p-3">
            {skin.portraitUrl ? (
              // biome-ignore lint/performance/noImgElement: a remote Blob URL, deliberately unoptimised
              <img
                src={skin.portraitUrl}
                alt=""
                className="h-[120px] w-full rounded-[10px] border-2 border-brown object-cover"
              />
            ) : (
              <span className="font-display flex h-[120px] items-center justify-center text-[64px] leading-none">
                {initial}
              </span>
            )}
            <span className="font-display text-lg leading-tight">{skin.name}</span>
          </span>
        )}
      </button>
      <div className="mt-2 flex flex-row items-center gap-2">
        <Pill tone={colourOf(members, skin.owner)}>{initialOf(members, skin.owner)}</Pill>
        {editable ? (
          <button type="button" className="label text-muted" onClick={() => setEditing(true)}>
            {STRINGS.skins.edit}
          </button>
        ) : null}
      </div>
      {editable ? (
        <NewSkinSheet
          open={editing}
          onClose={() => setEditing(false)}
          skin={skin}
          onSaved={() => setEditing(false)}
        />
      ) : null}
    </div>
  );
}
