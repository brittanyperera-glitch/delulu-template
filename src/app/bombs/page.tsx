import { PlantBomb } from "@/components/PlantBomb";
import { SectionPage } from "@/components/SectionPage";
import { Terminal } from "@/components/Terminal";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { bombsFor } from "@/lib/repo/bombs";
import { defaultSkinId } from "@/lib/repo/section-post";
import { listSkins } from "@/lib/repo/skins";
import { getMembers } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BombsPage() {
  const { player, season, day } = await dayContext();
  const members = await getMembers();
  const [views, skins, mine] = await Promise.all([
    bombsFor(db(), season.id, player, day),
    listSkins(db(), season.id),
    defaultSkinId(db(), season.id, player),
  ]);
  return (
    <SectionPage title={STRINGS.bombs.title} slug="bombs">
      <PlantBomb
        skins={skins.filter((s) => s.owner === player)}
        initialSkinId={mine}
        day={day}
        sender={player}
      />
      <Terminal views={views} members={members} />
    </SectionPage>
  );
}
