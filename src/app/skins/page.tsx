import { NewSkinLauncher } from "@/components/NewSkinLauncher";
import { SectionPage } from "@/components/SectionPage";
import { SkinCard } from "@/components/SkinCard";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { memberList } from "@/lib/members";
import { listSkins, skinUseCounts } from "@/lib/repo/skins";
import { getMembers } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SkinsPage() {
  // Both shelves are shown to both; player is needed only to gate the edit control to skins
  // she owns, server-side, the same way post/[id]/page.tsx gates OwnerControls.
  const { player, season } = await dayContext();
  const members = await getMembers();
  const [skins, counts] = await Promise.all([
    listSkins(db(), season.id),
    skinUseCounts(db(), season.id),
  ]);
  return (
    <SectionPage title={STRINGS.nav.skins} slug="skins">
      {/* Inventing a skin leads the page: it is the one action here, so it sits above the
          shelves rather than after a scroll past everyone's cards. */}
      <NewSkinLauncher />
      {skins.length === 0 ? (
        <p className="font-display text-2xl text-brown">{STRINGS.skins.none}</p>
      ) : null}
      {memberList(members).map(({ slug: p, name }) => {
        const theirs = skins.filter((s) => s.owner === p);
        if (theirs.length === 0) return null;
        return (
          <section key={p} className="flex flex-col gap-3">
            <h2 className="label text-muted">{name}</h2>
            <div className="flex flex-row flex-wrap items-start gap-4 pb-4 pt-4">
              {theirs.map((s, i) => (
                <SkinCard
                  key={s.id}
                  skin={s}
                  used={counts.get(s.id) ?? 0}
                  tilt={(i % 3) - 1}
                  editable={s.owner === player}
                />
              ))}
            </div>
          </section>
        );
      })}
    </SectionPage>
  );
}
