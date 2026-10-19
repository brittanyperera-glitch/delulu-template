import Link from "next/link";
import { SkinBadge } from "@/components/SkinBadge";
import { STRINGS } from "@/lib/content/strings";
import type { Skin } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

/**
 * Your skins, back on the wall. They were removed with MySkins when the player switcher moved
 * into the drawer, which took the badges with it: "you should be able to see your skins on the
 * wall too".
 *
 * Only the badges and the way into each one's posts. The switcher stays in the drawer, and
 * inventing a skin stays in the composer and the Skins room, so this is one job rather than
 * the three the old strip did.
 */
export function SkinStrip({ skins, me }: { skins: Skin[]; me: MemberId }) {
  const mine = skins.filter((s) => s.owner === me);
  if (mine.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <span className="label text-brown/70">{STRINGS.wall.yourSkins}</span>
      {/* Wrap, never scroll: a horizontal strip on a phone hid every skin past the third and
          read as "out of skins". Wrapping shows all of them however many there are. */}
      <div className="flex flex-row flex-wrap items-end gap-3 pb-1">
        {mine.map((s) => (
          <Link
            key={s.id}
            href={`/wall/skin-${s.id}`}
            className="flex shrink-0 flex-col items-center gap-1 no-underline"
          >
            <SkinBadge skin={s} lit />
            <span className="label max-w-[64px] truncate text-[9px] text-brown/70">{s.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
