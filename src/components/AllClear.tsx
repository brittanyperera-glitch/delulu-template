import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Coming } from "@/lib/outstanding";
import { bombFuseLine } from "@/lib/repo/bombs";

/**
 * What sits where the tray was when nothing is waiting on you, which will be most days.
 *
 * Going blank there would waste the loudest part of the wall and hide the run. So it flips
 * to a look forward: fuses, seals and the next checkpoint. It also makes the count trigger
 * legible, since "7 of 10 Big Dubs" is the only place a conditional fuse can be read.
 */
function line(c: Coming): { label: string; detail: string; bar: number | null } {
  if (c.kind === "prophecy") {
    return {
      label: STRINGS.wall.kinds.prophecy,
      detail: STRINGS.wall.sealedLine(c.sealed),
      bar: null,
    };
  }
  if (c.kind === "checkpoint") {
    return {
      label: STRINGS.wall.kinds.checkpoint,
      detail: STRINGS.wall.checkpointLine(c.day, c.away),
      bar: null,
    };
  }
  // Accepted and running. Nobody owes a move, but it should not be invisible either.
  if (c.kind === "bet") {
    return { label: STRINGS.wall.kinds.bet, detail: STRINGS.wall.openBetsLine(c.open), bar: null };
  }
  const { detail, bar } = bombFuseLine(c.bomb.fuse);
  return { label: STRINGS.wall.kinds.bomb, detail, bar };
}

export function AllClear({ coming }: { coming: Coming[] }) {
  if (coming.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-row items-baseline gap-2">
        <h2 className="font-display text-2xl leading-none text-brown">{STRINGS.wall.allClear}</h2>
        <Pill tone="avocado">{String(coming.length)}</Pill>
      </div>
      <Card tone="cream" className="flex flex-col gap-2 p-3">
        {coming.map((c) => {
          const l = line(c);
          return (
            // Only bombs repeat, and they have ids. Prophecies and checkpoints are one row each.
            <div
              key={c.kind === "bomb" ? `bomb-${c.bomb.id}` : c.kind}
              className="flex flex-col gap-1"
            >
              <div className="flex flex-row items-baseline justify-between gap-3">
                <span className="label text-brown">{l.label}</span>
                <span className="label-asis text-muted">{l.detail}</span>
              </div>
              {l.bar === null ? null : (
                <div className="h-1.5 w-full border-2 border-brown">
                  <div className="h-full bg-orange" style={{ width: `${l.bar}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </section>
  );
}
