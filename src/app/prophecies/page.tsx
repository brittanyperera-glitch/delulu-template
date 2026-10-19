import { ProphecyForm } from "@/components/ProphecyForm";
import { ProphecyVerdict } from "@/components/ProphecyVerdict";
import { SealedScrolls } from "@/components/SealedScrolls";
import { SectionPage } from "@/components/SectionPage";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { propheciesSealed, TOTAL_DAYS } from "@/lib/days";
import { db } from "@/lib/db/client";
import { nameOf } from "@/lib/members";
import { PARCHMENT } from "@/lib/parchment";
import { listAll, listMine, listSealed, tally } from "@/lib/repo/prophecies";
import { getMembers } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Prophecies is an exception to the retro base: aged parchment, not cream paper.
 * These five values are local to this section and are deliberately outside the token set.
 *
 * Before Day 100 you see your own words, and the other person's as sealed scrolls tagged with
 * their name: enough to know they wrote something and who, never what. The words themselves do
 * not leave the server until the day they open (listSealed selects no body).
 */
export default async function PropheciesPage() {
  const { player, season, day } = await dayContext();
  const members = await getMembers();
  const sealed = propheciesSealed(day);
  const opened = day >= TOTAL_DAYS;
  const [mine, theirs, all] = await Promise.all([
    listMine(db(), season.id, player),
    listSealed(db(), season.id, player),
    opened ? listAll(db(), season.id) : Promise.resolve([]),
  ]);
  const counts = tally(all);
  return (
    <SectionPage title={STRINGS.nav.prophecies} slug="prophecies">
      {opened ? (
        <>
          <p className={`label ${PARCHMENT.ink}`}>
            {STRINGS.prophecies.tally(counts.fulfilled, counts.delulu)}
          </p>
          <ul className="flex flex-col gap-5">
            {all.map((p) => (
              <li key={p.id} className={`border-b pb-4 ${PARCHMENT.rule}`}>
                <p className={`font-serif italic text-xl leading-snug ${PARCHMENT.ink}`}>
                  {STRINGS.prophecies.written} {STRINGS.prophecies.line(nameOf(members, p.about))}{" "}
                  {p.body}
                </p>
                <span className="label text-[#8c6a3f]">{nameOf(members, p.author)}</span>
                <ProphecyVerdict id={p.id} verdict={p.verdict} mine={p.about === player} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className={`label ${PARCHMENT.ink}`}>
            {sealed ? STRINGS.prophecies.opens : STRINGS.prophecies.seals}
          </p>
          {mine.length > 0 ? (
            <section className="flex flex-col gap-3">
              <span className={`label ${PARCHMENT.ink}`}>{STRINGS.prophecies.yours}</span>
              <ul className="flex flex-col gap-4">
                {mine.map((p) => (
                  <li key={p.id} className={`border-b pb-4 ${PARCHMENT.rule}`}>
                    <p className={`font-serif italic text-xl leading-snug ${PARCHMENT.ink}`}>
                      {STRINGS.prophecies.written}{" "}
                      {STRINGS.prophecies.line(nameOf(members, p.about))} {p.body}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <SealedScrolls scrolls={theirs} members={members} />
          {sealed ? null : <ProphecyForm me={player} />}
        </>
      )}
    </SectionPage>
  );
}
