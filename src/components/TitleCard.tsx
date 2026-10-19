import { Pill } from "@/components/ui/Pill";
import { Rings } from "@/components/ui/Rings";
import { STRINGS } from "@/lib/content/strings";
import { daysLeft, TOTAL_DAYS } from "@/lib/days";

/**
 * The count, back and louder. It was shrunk to a stamp when the tray became the hero, and
 * that was right about the hierarchy and wrong about the feel: the wall opened flat.
 *
 * So the count keeps its size but stops being the only thing at the top. The tray still sits
 * above the fold with it, which is the part that mattered: what needs doing is still on
 * screen, this is just no longer a cream box in a cream column.
 */
export function TitleCard({ day }: { day: number }) {
  const left = Math.max(0, daysLeft(day));
  const shownDay = Math.min(day, TOTAL_DAYS);
  return (
    <div className="relative overflow-hidden rounded-[30px] border-[3px] border-brown bg-mustard p-6 shadow-hard">
      <Rings size={260} band={22} className="absolute -right-16 -top-16 text-orange/40" />
      <div className="relative flex flex-col gap-1">
        <span className="label text-brown">{STRINGS.home.daysLeft}</span>
        <span className="font-display -ml-1 text-[128px] leading-[0.78] text-orange [text-shadow:6px_6px_0_#402310]">
          {left}
        </span>
        <div className="mt-3">
          <Pill tone="brown">{STRINGS.home.dayOf(shownDay, TOTAL_DAYS)}</Pill>
        </div>
      </div>
    </div>
  );
}
