"use client";
import { useState } from "react";
import { RoomsDrawer } from "@/components/RoomsDrawer";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { MemberId } from "@/lib/members";
import type { RoomCounts } from "@/lib/outstanding";

/**
 * The way out of wherever you are. One control, in the same place on every screen.
 *
 * `counts` is optional on purpose. The wall has already loaded them, so it passes them and
 * the drawer reads as a status board. A section page has not, and making all twelve load them
 * would put the wall's whole query set behind every room for a line of small text. There the
 * drawer is pure navigation.
 */
export function RoomsButton({
  counts,
  me,
  tone = "brown",
}: {
  counts?: RoomCounts;
  me?: MemberId;
  /** Must contrast with the room's paper. Defaults to the wall's brown. */
  tone?: PillTone;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        <Pill tone={tone}>{STRINGS.wall.rooms}</Pill>
      </button>
      <RoomsDrawer open={open} onClose={() => setOpen(false)} counts={counts} me={me} />
    </>
  );
}
