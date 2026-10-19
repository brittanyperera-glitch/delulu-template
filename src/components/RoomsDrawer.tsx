"use client";
import Link from "next/link";
import { useTransition } from "react";
import { switchPlayer } from "@/actions/auth";
import { useMembers } from "@/components/MembersProvider";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import { type MemberId, nameOf } from "@/lib/members";
import type { RoomCounts } from "@/lib/outstanding";
import { DRAWER_GROUPS, type Room, roomsIn } from "@/lib/rooms";

/**
 * A status board, not a menu. Every room carries a live count, so you can see where the
 * action is without opening anything, which is what earns the extra tap a drawer costs.
 *
 * Manifesto, Delusions and Spoilers lead the wall AND head the drawer: the drawer is the one
 * place every room is reachable, so leaving them out hid Delusions behind a single line under
 * the manifesto. They carry no count chip here, because they are not a to-do.
 *
 * The player switcher lives at the foot because MySkins used to be its ONLY home and has
 * left the wall. Without this there would be no way to switch player anywhere in the app.
 */
function detailFor(room: Room, c: RoomCounts | undefined): string | null {
  if (!c) return null;
  switch (room.slug) {
    case "manifesto":
    case "delusions":
    case "spoilers":
      // The creed tier is on the wall; in the drawer it is a plain way in, not a count.
      return null;
    case "dares":
      return c.dares > 0 ? STRINGS.drawer.dares(c.dares) : STRINGS.drawer.empty;
    case "bets":
      return c.bets > 0 ? STRINGS.drawer.bets(c.bets) : STRINGS.drawer.empty;
    case "truth":
      return c.truthAnswered ? STRINGS.drawer.truthDone : STRINGS.drawer.truthTodo;
    case "jar":
      return c.jar > 0 ? STRINGS.drawer.jar(c.jar) : STRINGS.drawer.empty;
    case "bombs":
      return c.bombs > 0 ? STRINGS.drawer.bombs(c.bombs) : STRINGS.drawer.empty;
    case "prophecies":
      return c.prophecies > 0 ? STRINGS.drawer.prophecies(c.prophecies) : STRINGS.drawer.empty;
    case "checkpoints":
      return c.nextCheckpoint === null
        ? STRINGS.drawer.empty
        : STRINGS.drawer.checkpoint(c.nextCheckpoint);
    case "skins":
      return c.skins > 0 ? STRINGS.drawer.skins(c.skins) : STRINGS.drawer.empty;
    case "soundtrack":
      return c.tracks > 0 ? STRINGS.drawer.tracks(c.tracks) : STRINGS.drawer.empty;
    default:
      return STRINGS.drawer.empty;
  }
}

export function RoomsDrawer({
  open,
  onClose,
  counts,
  me,
}: {
  open: boolean;
  onClose: () => void;
  /** Absent on a section page, which has not loaded them. The drawer is then just navigation. */
  counts?: RoomCounts;
  me?: MemberId;
}) {
  const members = useMembers();
  const [pending, start] = useTransition();
  return (
    <Sheet open={open} onClose={onClose} title={STRINGS.wall.rooms} side="left">
      <div className="flex flex-col gap-5">
        <Link
          href="/"
          onClick={onClose}
          className="flex flex-row items-baseline justify-between gap-3 border-b-[3px] border-brown py-2 no-underline"
        >
          <span className="font-display text-2xl leading-none text-brown">{STRINGS.wall.wall}</span>
          <span aria-hidden="true" className="label text-muted">
            &gt;
          </span>
        </Link>
        {DRAWER_GROUPS.map((g) => (
          <div key={g.group} className="flex flex-col gap-1">
            <span className="label text-muted">{g.label}</span>
            {roomsIn(g.group).map((room) => (
              <Link
                key={room.slug}
                href={`/${room.slug}`}
                onClick={onClose}
                className="flex flex-row items-baseline justify-between gap-3 border-b-2 border-brown/10 py-2 no-underline"
              >
                <span className="font-display text-xl leading-none text-brown">{room.label}</span>
                {detailFor(room, counts) === null ? null : (
                  <span className="label-asis text-muted">{detailFor(room, counts)}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
        <div className="flex flex-row items-center justify-between gap-3 border-t-[3px] border-brown pt-3">
          {me ? (
            <span className="label text-muted">
              {STRINGS.drawer.postingAs(nameOf(members, me))}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => switchPlayer())}
            className="label rounded-full border-2 border-dashed border-brown px-3 py-1 text-brown disabled:opacity-40"
          >
            {STRINGS.skins.notYou}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
