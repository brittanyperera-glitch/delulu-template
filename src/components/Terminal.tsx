import { OpenBomb } from "@/components/OpenBomb";
import { STRINGS } from "@/lib/content/strings";
import { type MembersMap, nameOf } from "@/lib/members";
import type { BombView } from "@/lib/repo/bombs";
import { TERM } from "@/lib/terminal";

/** The first still-counting day fuse, for the header's NEXT D-n line. Count and event bombs
 * have no day to report, so they are skipped rather than making the line lie. */
function firstDayFuse(views: BombView[]): number | null {
  for (const v of views) if (v.fuse.kind === "day") return v.fuse.daysLeft;
  return null;
}

export function Terminal({ views, members }: { views: BombView[]; members: MembersMap }) {
  const armed = views.filter((v) => !v.detonated && !v.due);
  const nextDay = firstDayFuse(armed);
  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex flex-row flex-wrap gap-x-4 gap-y-1 border-y-2 py-2 font-mono text-[11px] uppercase tracking-widest ${TERM.hair} ${TERM.green}`}
      >
        <span>{STRINGS.bombs.classified}</span>
        <span>{STRINGS.bombs.armed(armed.length)}</span>
        {nextDay === null ? null : <span>{STRINGS.bombs.next(nextDay)}</span>}
      </div>
      {views.length === 0 ? (
        <p className={`font-mono text-sm ${TERM.dim}`}>{STRINGS.bombs.none}</p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {views.map((v, i) => (
          <li
            key={v.id}
            className={`flex flex-col gap-2 border-2 p-3 font-mono ${TERM.hair} ${TERM.panel}`}
          >
            <div className="flex flex-row items-baseline justify-between gap-2 text-[11px] uppercase tracking-widest">
              <span className={TERM.green}>{STRINGS.bombs.payload(i + 1)}</span>
              {v.detonated ? (
                <span className={TERM.dim}>{STRINGS.bombs.gone}</span>
              ) : v.due ? (
                v.mine ? (
                  <span className={TERM.dim}>{STRINGS.bombs.pending}</span>
                ) : (
                  <OpenBomb id={v.id} />
                )
              ) : v.fuse.kind === "event" ? (
                <span className={TERM.dim}>{STRINGS.bombs.waiting}</span>
              ) : (
                <span className={TERM.green}>
                  {v.fuse.kind === "day"
                    ? STRINGS.bombs.dMinus(v.fuse.daysLeft)
                    : STRINGS.bombs.progress(v.fuse.have, v.fuse.target)}
                </span>
              )}
            </div>
            {!v.detonated && !v.due && v.fuse.kind !== "event" ? (
              <div className={`h-2 w-full border ${TERM.hair}`}>
                <div className={`h-full ${TERM.fuse}`} style={{ width: `${v.fuse.percent}%` }} />
              </div>
            ) : null}
            <span className={`text-[11px] uppercase tracking-widest ${TERM.dim}`}>
              {`${nameOf(members, v.sender)} ${STRINGS.bombs.to} ${nameOf(members, v.recipient)}`}
            </span>
            {v.body === null ? (
              <span className={`text-[11px] uppercase tracking-widest ${TERM.dim}`}>
                {STRINGS.bombs.eyesOnly}
              </span>
            ) : (
              <p
                className={`whitespace-pre-line break-words text-[15px] leading-snug ${TERM.green}`}
              >
                {v.body}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
