import Link from "next/link";
import { FilterRow } from "@/components/FilterRow";
import { SkinBadge } from "@/components/SkinBadge";
import { STRINGS } from "@/lib/content/strings";
import { db } from "@/lib/db/client";
import { listSkins } from "@/lib/repo/skins";
import { requireSeason } from "@/lib/season";
import { getPlayer } from "@/lib/session";

export default async function BySkinPage() {
  await getPlayer();
  const season = await requireSeason();
  const skins = await listSkins(db(), season.id);
  return (
    <main className="min-h-dvh px-5 pt-10 pb-28 flex flex-col gap-6 mx-auto w-full max-w-[480px]">
      <FilterRow current="skins" />
      <h1 className="font-display text-4xl text-brown">{STRINGS.filters.bySkin}</h1>
      <p className="font-body text-muted text-sm max-w-[38ch] leading-snug">
        {STRINGS.filters.bySkinBlurb}
      </p>
      <div className="flex flex-row flex-wrap gap-5">
        {skins.map((s) => (
          <Link key={s.id} href={`/wall/skin-${s.id}`} className="flex flex-col items-center gap-1">
            <SkinBadge skin={s} lit size={72} />
            <span className="label text-muted">{s.name}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
