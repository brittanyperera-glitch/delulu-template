import Link from "next/link";
import { AllClear } from "@/components/AllClear";
import { ComposerLauncher } from "@/components/ComposerLauncher";
import { CreedBlock } from "@/components/CreedBlock";
import { FilterRow } from "@/components/FilterRow";
import { SkinStrip } from "@/components/SkinStrip";
import { TickingBombs } from "@/components/TickingBombs";
import { TitleCard } from "@/components/TitleCard";
import { Button } from "@/components/ui/Button";
import { WaitingOn } from "@/components/WaitingOn";
import { Wall } from "@/components/Wall";
import { WallHeader } from "@/components/WallHeader";
import { YourMove } from "@/components/YourMove";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { currentManifesto } from "@/lib/manifesto";
import { wallState } from "@/lib/outstanding";
import { listDelusions } from "@/lib/repo/delusions";
import { listWall } from "@/lib/repo/posts";
import { defaultSkinId } from "@/lib/repo/section-post";
import { listSpoilers } from "@/lib/repo/spoilers";
import { getMembers } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ before?: string }>;
}) {
  const { player, season, day } = await dayContext();
  const { before } = await searchParams;
  const members = await getMembers();
  const [items, state, manifesto, delusions, spoilers, mineSkin] = await Promise.all([
    listWall(db(), season.id, { limit: 20, before: before ? Number(before) : undefined }),
    wallState(db(), season.id, player, members, day),
    currentManifesto(db(), season.id),
    listDelusions(db(), season.id),
    listSpoilers(db(), season.id),
    defaultSkinId(db(), season.id, player),
  ]);
  // The whole manifesto, not a sentence of it: it is the wall's anchor now.
  const creed = manifesto ?? "";
  const last = items.at(-1)?.post.id;
  // Day one is exactly when the wall is empty and `before` is unset: the inline CTA already
  // carries the invitation there, so the Fab would be a second route to the same composer.
  // That exclusivity is asserted in three places (home.test, the e2e openComposer helper and
  // the first-run procedure), so it must hold, not merely look right.
  const wallEmpty = items.length === 0 && !before;
  const ownSkins = state.skins.filter((s) => s.owner === player);
  // A ticking bomb is its own strip so it survives a full tray. The rest of the forward view
  // (seals, the next checkpoint, running bets) still only shows when nothing is waiting on you.
  const comingBombs = state.moves.coming.flatMap((c) => (c.kind === "bomb" ? [c.bomb] : []));
  const comingRest = state.moves.coming.filter((c) => c.kind !== "bomb");
  return (
    <main className="min-h-dvh px-5 pt-6 pb-28 lg:grid lg:grid-cols-[minmax(0,40%)_minmax(0,60%)] lg:gap-12 lg:px-16 lg:pt-10">
      {/* The rail keeps what needs doing in view while the stream scrolls past it. */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-10 lg:self-start">
        <WallHeader counts={state.counts} me={player} />
        <TitleCard day={day} />
        {state.moves.mine.length > 0 ? (
          <YourMove
            moves={state.moves.mine}
            me={player}
            members={members}
            skins={ownSkins}
            initialSkinId={mineSkin}
          />
        ) : (
          <AllClear coming={comingRest} />
        )}
        <TickingBombs bombs={comingBombs} />
        <WaitingOn waits={state.moves.theirs} members={members} />
        <SkinStrip skins={state.skins} me={player} />
        <CreedBlock
          body={creed}
          delusions={delusions.length}
          trululu={delusions.filter((d) => d.trululuPostId !== null).length}
          spoilers={spoilers.length}
          happened={spoilers.filter((s) => s.postId !== null).length}
        />
      </div>
      <div className="mt-6 flex flex-col gap-6 lg:mt-0">
        <FilterRow current="" />
        {wallEmpty ? (
          <div className="flex flex-col items-start gap-4">
            <p className="font-body max-w-[36ch] text-base leading-snug text-brown">
              {STRINGS.home.empty}
            </p>
            <ComposerLauncher
              skins={state.skins}
              player={player}
              inline
              label={STRINGS.home.first}
            />
          </div>
        ) : (
          <Wall items={items} me={player} members={members} bombs={comingBombs} />
        )}
        {/* Pages by navigation. The spec asks for infinite scroll, which the desktop pass adds. */}
        {items.length === 20 && last ? (
          <Link href={`/?before=${last}`} className="self-center">
            <Button kind="ghost">{STRINGS.home.more}</Button>
          </Link>
        ) : null}
      </div>
      {wallEmpty ? null : <ComposerLauncher skins={state.skins} player={player} />}
    </main>
  );
}
