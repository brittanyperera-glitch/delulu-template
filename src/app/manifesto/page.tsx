import Link from "next/link";
import { ManifestoEditor } from "@/components/ManifestoEditor";
import { SectionPage } from "@/components/SectionPage";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { TOTAL_DAYS } from "@/lib/days";
import { db } from "@/lib/db/client";
import { hasEditedToday, listVersions } from "@/lib/manifesto";
import { initialOf } from "@/lib/members";
import { getMembers } from "@/lib/session";

export const dynamic = "force-dynamic";

// The ruled line pitch matches the mono leading below, so the text sits on the rules.
const RULED =
  "repeating-linear-gradient(to bottom, transparent 0 27px, rgba(64,35,16,0.16) 27px 28px)";

export default async function ManifestoPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { season, player, day } = await dayContext();
  const { v } = await searchParams;
  const members = await getMembers();
  const versions = await listVersions(db(), season.id);
  // Nobody should see prior manifesto drafts, or reach one via ?v=, before Day 100.
  const canSeeHistory = day >= TOTAL_DAYS;
  const asked = canSeeHistory && v ? versions.find((x) => x.id === Number(v)) : undefined;
  const shown = asked ?? versions[0];
  const isCurrent = shown.id === versions[0].id;
  const spent = await hasEditedToday(db(), season.id, player, day);
  return (
    <SectionPage title={STRINGS.nav.manifesto} slug="manifesto">
      <div className="flex flex-row gap-4">
        <article
          className="flex-1 min-w-0 rounded-card border-[3px] border-brown bg-card p-4 shadow-hard"
          style={{ backgroundImage: RULED }}
        >
          <p className="font-mono whitespace-pre-line text-[15px] leading-[28px] text-ink">
            {shown.body}
          </p>
        </article>
        {canSeeHistory ? (
          <nav className="flex w-16 shrink-0 flex-col gap-2" aria-label={STRINGS.manifesto.rail}>
            {versions.map((ver) => (
              <Link
                key={ver.id}
                href={ver.id === versions[0].id ? "/manifesto" : `/manifesto?v=${ver.id}`}
              >
                <Pill
                  tone={ver.id === shown.id ? "brown" : "cream"}
                >{`D${ver.day} ${initialOf(members, ver.author)}`}</Pill>
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      {!canSeeHistory ? <p className="label text-muted">{STRINGS.manifesto.locked}</p> : null}
      {isCurrent ? (
        <ManifestoEditor body={shown.body} spent={spent} />
      ) : (
        <Link href="/manifesto" className="label self-start text-brown underline">
          {STRINGS.manifesto.current}
        </Link>
      )}
    </SectionPage>
  );
}
