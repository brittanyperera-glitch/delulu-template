import { CreditsRoll } from "@/components/CreditsRoll";
import { PlantDelusion } from "@/components/PlantDelusion";
import { SectionPage } from "@/components/SectionPage";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { listDelusions } from "@/lib/repo/delusions";
import { listWall } from "@/lib/repo/posts";
import { defaultSkinId } from "@/lib/repo/section-post";
import { listSkins } from "@/lib/repo/skins";

export const dynamic = "force-dynamic";

export default async function DelusionsPage() {
  const { player, season } = await dayContext();
  const [items, skins, recent, mine] = await Promise.all([
    listDelusions(db(), season.id),
    listSkins(db(), season.id),
    listWall(db(), season.id, { limit: 12 }),
    defaultSkinId(db(), season.id, player),
  ]);
  const myskins = skins.filter((s) => s.owner === player);
  return (
    <SectionPage title={STRINGS.nav.delusions} slug="delusions">
      <PlantDelusion me={player} skins={myskins} initialSkinId={mine} />
      {items.length === 0 ? (
        <p className="font-display text-2xl text-brown">{STRINGS.delusions.none}</p>
      ) : null}
      <CreditsRoll
        items={items}
        skins={myskins}
        initialSkinId={mine}
        recent={recent.map((i) => ({
          id: i.post.id,
          day: i.post.day,
          label: (i.post.body ?? i.post.type).slice(0, 24),
        }))}
      />
    </SectionPage>
  );
}
