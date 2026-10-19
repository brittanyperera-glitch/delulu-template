import { notFound } from "next/navigation";
import { Podiums } from "@/components/Podiums";
import { SectionPage } from "@/components/SectionPage";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { memberIds } from "@/lib/members";
import { answeredDays, answersFor, questionFor, revealed } from "@/lib/repo/truth";
import { getMembers } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TruthPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { player, season, day } = await dayContext();
  const { day: asked } = await searchParams;
  const members = await getMembers();
  const ids = memberIds(members);
  const parsedAsked = asked === undefined ? undefined : Number(asked);
  if (parsedAsked !== undefined && !Number.isInteger(parsedAsked)) notFound();
  const shownDay = parsedAsked ?? day;
  const question = questionFor(shownDay);
  const [answers, archive] = await Promise.all([
    answersFor(db(), season.id, shownDay),
    answeredDays(db(), season.id, ids, day),
  ]);
  return (
    <SectionPage title={STRINGS.nav.truth} slug="truth">
      {question ? (
        <Podiums
          question={question}
          me={player}
          members={members}
          answers={answers}
          open={revealed(answers, ids, shownDay, day)}
        />
      ) : (
        <p className="font-display text-2xl text-brown">{STRINGS.sections.empty}</p>
      )}
      {archive.length > 0 ? (
        <details className="rounded-card border-[3px] border-brown bg-card p-4 shadow-hard">
          <summary className="label text-brown">{STRINGS.truth.archive(archive.length)}</summary>
          <div className="flex flex-row flex-wrap gap-2 pt-3">
            {archive.map((d) => (
              <a key={d} href={`/truth?day=${d}`}>
                <Pill tone={d === shownDay ? "brown" : "cream"}>{`Day ${d}`}</Pill>
              </a>
            ))}
          </div>
        </details>
      ) : null}
    </SectionPage>
  );
}
