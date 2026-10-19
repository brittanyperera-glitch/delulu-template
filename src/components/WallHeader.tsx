import { RoomsButton } from "@/components/RoomsButton";
import type { MemberId } from "@/lib/members";
import type { RoomCounts } from "@/lib/outstanding";

/**
 * One thin line: the day on the left, the way out on the right.
 *
 * The days-left number used to be 160px of the loudest thing on screen and also the least
 * actionable. It is a stamp now, always present and never the main event, which is what
 * frees the top of the wall for what actually needs doing.
 *
 * The ROOMS control goes here rather than in a second floating button, because the composer
 * already owns the bottom-right corner and two round controls in one corner is furniture.
 */
export function WallHeader({ counts, me }: { counts: RoomCounts; me: MemberId }) {
  return (
    // Just the way out. The day used to live here as a stamp; TitleCard carries it again now
    // and showing it twice on one screen reads as a bug.
    <div className="flex flex-row items-center justify-end gap-3">
      <RoomsButton counts={counts} me={me} />
    </div>
  );
}
