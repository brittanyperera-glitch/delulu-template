"use client";
import { useState } from "react";
import type { Skin } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";
import { Composer } from "./Composer";
import { Fab } from "./Fab";

export function ComposerLauncher({
  skins,
  player,
  inline = false,
  label,
}: {
  skins: Skin[];
  player: MemberId;
  inline?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {inline ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="label h-12 rounded-full border-2 border-dashed border-brown px-5 text-brown"
        >
          {label}
        </button>
      ) : (
        <Fab onClick={() => setOpen(true)} />
      )}
      <Composer
        open={open}
        onClose={() => setOpen(false)}
        skins={skins.filter((s) => s.owner === player)}
        player={player}
      />
    </>
  );
}
