"use client";
import { STRINGS } from "@/lib/content/strings";
import type { Skin } from "@/lib/db/schema";
import { SkinBadge } from "./SkinBadge";

export function SkinPicker({
  skins,
  selectedId,
  onSelect,
  onNew,
}: {
  skins: Skin[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew?: () => void;
}) {
  return (
    <div
      className="flex flex-row items-end gap-3 overflow-x-auto pb-1"
      role="radiogroup"
      aria-label={STRINGS.composer.skinPicker}
    >
      {skins.map((s) => (
        <div key={s.id} className="flex flex-col items-center gap-1">
          <SkinBadge skin={s} lit={s.id === selectedId} onClick={() => onSelect(s.id)} />
          <span className="label text-[9px] text-muted">{s.name}</span>
        </div>
      ))}
      {/* Only where inventing a skin actually goes somewhere. Eight of the ten call sites
          passed a no-op, so this drew a dead control, and two of them now sit on the wall. */}
      {onNew ? (
        <button
          type="button"
          onClick={onNew}
          className="label h-[58px] rounded-full border-2 border-dashed border-brown px-4 text-brown shrink-0"
        >
          {STRINGS.composer.newSkin}
        </button>
      ) : null}
    </div>
  );
}
