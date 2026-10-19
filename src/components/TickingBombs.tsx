import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import { type BombView, bombFuseLine } from "@/lib/repo/bombs";

/**
 * The bombs still counting down, always on the wall. They used to live only in the all-clear
 * forward view, which the tray hides the moment anything is waiting on you, so a bomb could be
 * ticking on the recipient and never show. Its own strip fixes that: it stands whatever else
 * the wall is doing. The note stays sealed, only the fuse is ever drawn, so nothing here leaks
 * the words before they are opened.
 */
export function TickingBombs({ bombs }: { bombs: BombView[] }) {
  if (bombs.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-row items-baseline gap-2">
        <h2 className="font-display text-2xl leading-none text-brown">{STRINGS.wall.ticking}</h2>
        <Pill tone="rust">{String(bombs.length)}</Pill>
      </div>
      <Card tone="cream" className="flex flex-col gap-2 p-3">
        {bombs.map((b) => {
          const { detail, bar } = bombFuseLine(b.fuse);
          return (
            <div key={`bomb-${b.id}`} className="flex flex-col gap-1">
              <div className="flex flex-row items-baseline justify-between gap-3">
                <span className="label text-brown">{STRINGS.wall.kinds.bomb}</span>
                <span className="label-asis text-muted">{detail}</span>
              </div>
              {bar === null ? null : (
                <div className="h-1.5 w-full border-2 border-brown">
                  <div className="h-full bg-rust" style={{ width: `${bar}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </section>
  );
}
