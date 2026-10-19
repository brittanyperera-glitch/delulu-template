"use client";
import { DareCard } from "@/components/DareCard";
import type { Dare, Skin } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

export function DareDeck({
  dares,
  me,
  skins,
  initialSkinId,
}: {
  dares: Dare[];
  me: MemberId;
  skins: Skin[];
  initialSkinId: number | null;
}) {
  return (
    <ul className="flex flex-col gap-5">
      {dares.map((d) => (
        <li key={d.id}>
          <DareCard dare={d} me={me} skins={skins} initialSkinId={initialSkinId} />
        </li>
      ))}
    </ul>
  );
}
