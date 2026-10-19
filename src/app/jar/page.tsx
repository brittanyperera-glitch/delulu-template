import { AddQuest } from "@/components/AddQuest";
import { DrawButton } from "@/components/DrawButton";
import { DrawnSlip } from "@/components/DrawnSlip";
import { JarGlass } from "@/components/JarGlass";
import { SectionPage } from "@/components/SectionPage";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { countsBySize, drawnFor, JAR_SIZES } from "@/lib/repo/jar";
import { defaultSkinId } from "@/lib/repo/section-post";
import { listSkins } from "@/lib/repo/skins";

export const dynamic = "force-dynamic";

export default async function JarPage() {
  const { player, season } = await dayContext();
  const [counts, drawn, skins, mine] = await Promise.all([
    countsBySize(db(), season.id),
    drawnFor(db(), season.id, player),
    listSkins(db(), season.id),
    defaultSkinId(db(), season.id, player),
  ]);
  const empty = !drawn && JAR_SIZES.every((s) => counts[s] === 0);
  return (
    <SectionPage title={STRINGS.nav.jar} slug="jar">
      {drawn ? (
        <DrawnSlip
          item={drawn}
          skins={skins.filter((s) => s.owner === player)}
          initialSkinId={mine}
        />
      ) : empty ? (
        <p className="font-display text-2xl text-brown">{STRINGS.jar.none}</p>
      ) : (
        <>
          <JarGlass counts={counts} />
          <span className="label text-muted">{STRINGS.jar.draw}</span>
          <div className="flex flex-row flex-wrap gap-2">
            {JAR_SIZES.map((s) => (
              <DrawButton key={s} size={s} count={counts[s]} />
            ))}
          </div>
        </>
      )}
      <AddQuest />
    </SectionPage>
  );
}
