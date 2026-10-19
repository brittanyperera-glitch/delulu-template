import { AddSpoiler } from "@/components/AddSpoiler";
import { MoodBoard } from "@/components/MoodBoard";
import { SectionPage } from "@/components/SectionPage";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { defaultSkinId } from "@/lib/repo/section-post";
import { listSkins } from "@/lib/repo/skins";
import { listSpoilers } from "@/lib/repo/spoilers";

export const dynamic = "force-dynamic";

export default async function SpoilersPage() {
  const { player, season } = await dayContext();
  const [items, skins, mine] = await Promise.all([
    listSpoilers(db(), season.id),
    listSkins(db(), season.id),
    defaultSkinId(db(), season.id, player),
  ]);
  const myskins = skins.filter((s) => s.owner === player);
  return (
    <SectionPage title={STRINGS.nav.spoilers} slug="spoilers">
      <AddSpoiler skins={myskins} initialSkinId={mine} />
      {items.length === 0 ? (
        <p className="font-display text-2xl text-brown">{STRINGS.spoilers.none}</p>
      ) : null}
      <MoodBoard spoilers={items} skins={myskins} initialSkinId={mine} />
    </SectionPage>
  );
}
