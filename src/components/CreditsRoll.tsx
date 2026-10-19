"use client";
import { useState } from "react";
import { useMembers } from "@/components/MembersProvider";
import { TrululuSheet } from "@/components/TrululuSheet";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Delusion, Skin } from "@/lib/db/schema";
import { nameOf } from "@/lib/members";

export type RecentPost = { id: number; day: number; label: string };

/** The shared list of delusions. Each line is tagged with who it is about; tapping an
 *  unstamped one opens the sheet that turns it Trululu. */
export function CreditsRoll({
  items,
  skins,
  initialSkinId,
  recent,
}: {
  items: Delusion[];
  skins: Skin[];
  initialSkinId: number | null;
  recent: RecentPost[];
}) {
  const members = useMembers();
  const [open, setOpen] = useState<Delusion | null>(null);
  return (
    <>
      <div>
        <ul className="flex flex-col items-center gap-4 text-center">
          {items.map((d) => {
            const done = d.trululuPostId !== null;
            return (
              <li key={d.id} className="w-full">
                <button
                  type="button"
                  onClick={() => (done ? undefined : setOpen(d))}
                  disabled={done}
                  className="w-full"
                >
                  <span
                    className={`font-display block break-words text-xl leading-tight ${done ? "text-orange" : "text-brown"}`}
                  >
                    {d.body}
                  </span>
                  <span className="label mt-1 inline-flex items-center gap-2 text-muted">
                    {nameOf(members, d.about)}
                    {done ? <Pill tone="mustard">{STRINGS.delusions.stamp}</Pill> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <TrululuSheet
        delusion={open}
        onClose={() => setOpen(null)}
        skins={skins}
        initialSkinId={initialSkinId}
        recent={recent}
      />
    </>
  );
}
