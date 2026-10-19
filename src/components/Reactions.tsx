"use client";
import { useOptimistic, useTransition } from "react";
import { toggleReactionAction } from "@/actions/reactions";
import { useMembers } from "@/components/MembersProvider";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Reaction } from "@/lib/db/schema";
import { type MemberId, nameOf } from "@/lib/members";

// STRINGS, not the repo module: importing @/lib/repo/* here would pull drizzle into the client bundle.
const REACTIONS = STRINGS.reactions;

export function Reactions({
  postId,
  reactions,
  me,
}: {
  postId: number;
  reactions: Reaction[];
  me: MemberId;
}) {
  const members = useMembers();
  const [list, apply] = useOptimistic(
    reactions,
    (xs: Reaction[], a: { word: string; mine: boolean }) =>
      a.mine
        ? xs.filter((r) => !(r.word === a.word && r.author === me))
        : [...xs, { id: -1, postId, author: me, word: a.word }],
  );
  const [isPending, start] = useTransition();
  return (
    <div className="flex flex-row flex-wrap gap-2">
      {REACTIONS.map((word) => {
        const mine = list.some((r) => r.word === word && r.author === me);
        const theirs = list.some((r) => r.word === word && r.author !== me);
        const who = list
          .filter((r) => r.word === word)
          .map((r) => nameOf(members, r.author))
          .join(" and ");
        return (
          <button
            key={word}
            type="button"
            disabled={isPending}
            aria-pressed={mine}
            aria-label={who ? `${word}, ${who}` : word}
            onClick={() =>
              start(async () => {
                apply({ word, mine });
                await toggleReactionAction(postId, word);
              })
            }
          >
            <Pill asIs tone={mine ? "mustard" : theirs ? "avocado" : "cream"}>
              {word}
            </Pill>
          </button>
        );
      })}
    </div>
  );
}
