import { STRINGS } from "@/lib/content/strings";
import { type MembersMap, memberList } from "@/lib/members";
import type { Waiting } from "@/lib/outstanding";

/**
 * The quieter half of the board: what is in their court. Without it you cannot tell whether
 * a thing is stalled on you or on them, and the app reads as two solo apps rather than a
 * game between two people.
 *
 * It is a status display, never a nudge. Nothing here notifies anybody, which keeps the
 * original no-pings rule intact.
 *
 * Each row prints a kind and a fixed sentence. The data carries nothing else BY DESIGN, so
 * this component structurally cannot leak his unanswered truth or an unflipped dare.
 */
export function WaitingOn({ waits, members }: { waits: Waiting[]; members: MembersMap }) {
  if (waits.length === 0) return null;
  const who = new Set(waits.flatMap((w) => w.who));
  const names = memberList(members)
    .filter((m) => who.has(m.slug))
    .map((m) => m.name);
  return (
    <section className="flex flex-col gap-1 opacity-70">
      <span className="label-asis text-muted">{STRINGS.wall.waitingOn(names)}</span>
      <ul className="flex flex-col gap-0.5">
        {waits.map((w) => (
          <li key={w.kind} className="font-body text-sm leading-snug text-muted">
            {`${STRINGS.wall.kinds[w.kind]}${w.count > 1 ? ` (${w.count})` : ""}: ${STRINGS.wall.waits[w.kind]}`}
          </li>
        ))}
      </ul>
    </section>
  );
}
