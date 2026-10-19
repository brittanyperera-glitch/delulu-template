import { notFound } from "next/navigation";
import { FilterRow } from "@/components/FilterRow";
import { Scrap } from "@/components/Scrap";
import { Trophy } from "@/components/Trophy";
import { STRINGS } from "@/lib/content/strings";
import { db } from "@/lib/db/client";
import { parseFilter } from "@/lib/filters";
import { trululuLines } from "@/lib/repo/delusions";
import { listWall } from "@/lib/repo/posts";
import { skinById } from "@/lib/repo/skins";
import { requireSeason } from "@/lib/season";
import { getMembers, getPlayer } from "@/lib/session";

export default async function FilterPage({ params }: { params: Promise<{ filter: string }> }) {
  const player = await getPlayer();
  const members = await getMembers();
  const { filter } = await params;
  const f = parseFilter(filter);
  if (!f) notFound();
  const season = await requireSeason();
  const items = await listWall(
    db(),
    season.id,
    f.kind === "stamp" ? { stamp: f.stamp, limit: 200 } : { skinId: f.id, limit: 200 },
  );
  const title =
    f.kind === "stamp"
      ? STRINGS.filters.titles[f.stamp]
      : ((await skinById(db(), f.id))?.name ?? STRINGS.filters.bySkin);
  const lines =
    f.kind === "stamp" && f.stamp === "TRULULU"
      ? await trululuLines(db(), season.id)
      : new Map<number, string>();
  const shelf = f.kind === "stamp" && f.stamp === "W";
  const shame = f.kind === "stamp" && f.stamp === "L";
  return (
    // The hall of shame's paper covers the window, not just the centred column,
    // or it reads as a mistake rather than a different room.
    <div className={`min-h-dvh ${shame ? "bg-dust" : ""}`}>
      <main className="px-5 pt-10 pb-28 flex flex-col gap-6 mx-auto w-full max-w-[480px]">
        <FilterRow current={filter} />
        <div className="flex flex-row items-baseline justify-between">
          <h1 className="font-display text-4xl text-brown">{title}</h1>
          <span className="label text-muted">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <p className="font-body text-brown text-base max-w-[34ch] leading-snug">
            {f.kind === "stamp" ? STRINGS.filters.emptyBy[f.stamp] : STRINGS.filters.emptySkin}
          </p>
        ) : null}
        <div className="flex flex-col gap-8">
          {items.map((item) => (
            <div
              key={item.post.id}
              className={`flex flex-row items-start gap-3 ${shelf || shame ? "border-b-[3px] border-brown pb-8" : ""}`}
            >
              {shelf || shame ? <Trophy dusty={shame} /> : null}
              <div className="flex-1 min-w-0">
                {lines.get(item.post.id) ? (
                  <p className="font-display mb-2 text-lg leading-tight text-orange">
                    {lines.get(item.post.id)}
                  </p>
                ) : null}
                <Scrap item={item} me={player} members={members} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
