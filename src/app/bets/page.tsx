import { BetSlip } from "@/components/BetSlip";
import { NewBet } from "@/components/NewBet";
import { SectionPage } from "@/components/SectionPage";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { listBets } from "@/lib/repo/bets";
import { defaultSkinId } from "@/lib/repo/section-post";
import { listSkins } from "@/lib/repo/skins";

export const dynamic = "force-dynamic";

export default async function BetsPage() {
  const { player, season } = await dayContext();
  const [items, skins, mine] = await Promise.all([
    listBets(db(), season.id),
    listSkins(db(), season.id),
    defaultSkinId(db(), season.id, player),
  ]);
  return (
    <SectionPage title={STRINGS.nav.bets} slug="bets">
      <NewBet me={player} />
      {items.length === 0 ? (
        <p className="font-display text-2xl text-brown">{STRINGS.bets.none}</p>
      ) : null}
      <BetSlip
        bets={items}
        me={player}
        skins={skins.filter((s) => s.owner === player)}
        initialSkinId={mine}
      />
    </SectionPage>
  );
}
