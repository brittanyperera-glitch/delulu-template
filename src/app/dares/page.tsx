import { DareDeck } from "@/components/DareDeck";
import { DealDare } from "@/components/DealDare";
import { SectionPage } from "@/components/SectionPage";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { listDares } from "@/lib/repo/dares";
import { defaultSkinId } from "@/lib/repo/section-post";
import { listSkins } from "@/lib/repo/skins";

export const dynamic = "force-dynamic";

export default async function DaresPage() {
  const { player, season } = await dayContext();
  const [items, skins, mine] = await Promise.all([
    listDares(db(), season.id),
    listSkins(db(), season.id),
    defaultSkinId(db(), season.id, player),
  ]);
  return (
    <SectionPage title={STRINGS.nav.dares} slug="dares">
      <DealDare me={player} />
      {items.length === 0 ? (
        <p className="font-display text-2xl text-brown">{STRINGS.dares.none}</p>
      ) : null}
      <DareDeck
        dares={items}
        me={player}
        skins={skins.filter((s) => s.owner === player)}
        initialSkinId={mine}
      />
    </SectionPage>
  );
}
