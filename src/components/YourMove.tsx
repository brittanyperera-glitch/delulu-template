import { BetSlip } from "@/components/BetSlip";
import { DareCard } from "@/components/DareCard";
import { OpenBomb } from "@/components/OpenBomb";
import { ProphecyVerdict } from "@/components/ProphecyVerdict";
import { CheckpointCard } from "@/components/SaveScreen";
import { TruthAnswerForm } from "@/components/TruthAnswerForm";
import { Disclosure } from "@/components/ui/Disclosure";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Skin } from "@/lib/db/schema";
import { type MemberId, type MembersMap, nameOf } from "@/lib/members";
import type { Move, MoveKind } from "@/lib/outstanding";

/**
 * The hero of the wall: what is waiting on you, and the means to clear it without leaving.
 *
 * Every row is COLLAPSED by default. That is not a style choice: four expanded forms would
 * make the tray taller than the phone and recreate the clutter this redesign exists to
 * remove. Collapsed rows cap the height whatever is waiting, and the headline carries enough
 * to decide whether opening it is worth a tap.
 *
 * Each body reuses the section's own component rather than a tray-shaped copy, so acting here
 * and acting in the room run exactly the same code. BetSlip takes a list, so it gets a
 * one-item one.
 */
const PAPER: Record<MoveKind, string> = {
  truth: "bg-dust",
  dare: "bg-mustard",
  bet: "bg-mustard",
  bomb: "bg-dust",
  prophecy: "bg-[#d9c49a]",
  checkpoint: "bg-mustard",
};

const TONE: Record<MoveKind, PillTone> = {
  truth: "rust",
  dare: "orange",
  bet: "mustard",
  bomb: "avocado",
  prophecy: "cream",
  checkpoint: "brown",
};

function keyOf(m: Move): string {
  switch (m.kind) {
    case "truth":
      return "truth";
    case "dare":
      return `dare-${m.dare.id}`;
    case "bet":
      return `bet-${m.bet.id}`;
    case "bomb":
      return `bomb-${m.bomb.id}`;
    case "prophecy":
      return `prophecy-${m.prophecy.id}`;
    case "checkpoint":
      return `checkpoint-${m.id}`;
  }
}

function Headline({ kind, note }: { kind: MoveKind; note: string }) {
  return (
    <span className="flex min-w-0 flex-row items-center gap-2">
      <Pill tone={TONE[kind]}>{STRINGS.wall.kinds[kind]}</Pill>
      <span className="font-body min-w-0 truncate text-base font-bold text-brown">{note}</span>
    </span>
  );
}

export function YourMove({
  moves,
  me,
  members,
  skins,
  initialSkinId,
}: {
  moves: Move[];
  me: MemberId;
  members: MembersMap;
  skins: Skin[];
  initialSkinId: number | null;
}) {
  if (moves.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-row items-baseline gap-2">
        <h2 className="font-display text-2xl leading-none text-brown">{STRINGS.wall.yourMove}</h2>
        <Pill tone="orange">{String(moves.length)}</Pill>
      </div>
      {moves.map((m) => (
        <Disclosure
          key={keyOf(m)}
          tone={PAPER[m.kind]}
          headline={<Row move={m} members={members} />}
        >
          <Body move={m} me={me} skins={skins} initialSkinId={initialSkinId} />
        </Disclosure>
      ))}
    </section>
  );
}

function Row({ move, members }: { move: Move; members: MembersMap }) {
  switch (move.kind) {
    case "truth":
      return <Headline kind="truth" note={move.question} />;
    case "dare":
      return <Headline kind="dare" note={STRINGS.dares.dealt(nameOf(members, move.dare.darer))} />;
    case "bet":
      return <Headline kind="bet" note={move.bet.claim} />;
    case "bomb":
      return <Headline kind="bomb" note={STRINGS.dares.dealt(nameOf(members, move.bomb.sender))} />;
    case "prophecy":
      return <Headline kind="prophecy" note={move.prophecy.body} />;
    case "checkpoint":
      return <Headline kind="checkpoint" note={STRINGS.checkpoints.card(move.day)} />;
  }
}

function Body({
  move,
  me,
  skins,
  initialSkinId,
}: {
  move: Move;
  me: MemberId;
  skins: Skin[];
  initialSkinId: number | null;
}) {
  switch (move.kind) {
    case "truth":
      return <TruthAnswerForm draft={null} locked={false} />;
    case "dare":
      return <DareCard dare={move.dare} me={me} skins={skins} initialSkinId={initialSkinId} />;
    case "bet":
      return <BetSlip bets={[move.bet]} me={me} skins={skins} initialSkinId={initialSkinId} />;
    case "bomb":
      // The words are still on the server until it is opened, which is why there is nothing
      // to show here but the control.
      return <OpenBomb id={move.bomb.id} />;
    case "prophecy":
      return <ProphecyVerdict id={move.prophecy.id} verdict={move.prophecy.verdict} mine />;
    case "checkpoint":
      return <CheckpointCard id={move.id} day={move.day} />;
  }
}
