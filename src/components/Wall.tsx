import type { MemberId, MembersMap } from "@/lib/members";
import type { BombView } from "@/lib/repo/bombs";
import type { WallItem } from "@/lib/repo/posts";
import { Scrap, TickingBombCard } from "./Scrap";

export function Wall({
  items,
  me,
  members,
  bombs = [],
}: {
  items: WallItem[];
  me: MemberId;
  members: MembersMap;
  /** Still-ticking bombs, both directions. Rendered ahead of the posts, soonest due first. */
  bombs?: BombView[];
}) {
  return (
    <div className="flex flex-col gap-7 lg:[column-count:2] lg:[column-gap:32px] lg:block">
      {bombs.map((bomb) => (
        <div key={`bomb-${bomb.id}`} className="lg:mb-8 lg:[break-inside:avoid]">
          <TickingBombCard bomb={bomb} members={members} />
        </div>
      ))}
      {items.map((item) => (
        <div key={item.post.id} className="lg:mb-8 lg:[break-inside:avoid]">
          <Scrap item={item} me={me} members={members} />
        </div>
      ))}
    </div>
  );
}
