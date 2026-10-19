import { CHECKPOINTS, TOTAL_DAYS } from "@/lib/days";
import type { Db } from "@/lib/db/client";
import type { Bet, Dare, Prophecy, Skin, Track, TruthAnswer } from "@/lib/db/schema";
import { type MemberId, type MembersMap, memberIds } from "@/lib/members";
import { listBets } from "@/lib/repo/bets";
import { type BombView, bombsFor } from "@/lib/repo/bombs";
import { type CheckpointView, checkpointViews } from "@/lib/repo/checkpoints";
import { listDares } from "@/lib/repo/dares";
import { listJar } from "@/lib/repo/jar";
import { countAll, listAll } from "@/lib/repo/prophecies";
import { listSkins } from "@/lib/repo/skins";
import { listTracks } from "@/lib/repo/tracks";
import { answersFor, questionFor } from "@/lib/repo/truth";

/**
 * Everything the wall needs to say what is waiting: on you, on them, what is coming, and what
 * each room holds.
 *
 * It COMPOSES the existing readers rather than writing new predicates. bombsFor already
 * withholds a bomb's words from its recipient, and re-deriving that here would be a second
 * copy of a security decision. checkpointViews was already read by the wall.
 *
 * The tray and the drawer need the same rows, so they are two PURE derivations over ONE load
 * rather than two functions that each query. Calling both separately doubled the wall's
 * queries, which is the cost this file exists to avoid.
 *
 * This is data only. No copy, so nothing here can drift from STRINGS, and the waiting-on rows
 * carry a kind, a count and who it is stalled on, never what it says, which is why they
 * cannot leak an unanswered truth.
 */
export type MoveKind = "truth" | "dare" | "bet" | "bomb" | "prophecy" | "checkpoint";

export type Move =
  | { kind: "truth"; question: string }
  | { kind: "dare"; dare: Dare }
  | { kind: "bet"; bet: Bet }
  | { kind: "bomb"; bomb: BombView }
  | { kind: "prophecy"; prophecy: Prophecy }
  | { kind: "checkpoint"; id: number; day: number };

/**
 * Deliberately just the kind, how many and on whom. The point is to say a thing is stalled, not
 * what it says, and a count keeps three stalled dares to one line instead of three identical ones.
 *
 * A checkpoint is excluded by the type, not by convention: a pending one goes to EVERY member's
 * tray, so it is never stalled on anyone and there is no sentence for it.
 */
export type WaitKind = Exclude<MoveKind, "checkpoint">;
export type Waiting = { kind: WaitKind; count: number; who: MemberId[] };

export type Coming =
  | { kind: "bomb"; bomb: BombView }
  | { kind: "prophecy"; sealed: number }
  | { kind: "checkpoint"; day: number; away: number }
  /** Accepted and unsettled. Either party can concede, so it is nobody's move. */
  | { kind: "bet"; open: number };

export type Outstanding = { mine: Move[]; theirs: Waiting[]; coming: Coming[] };

export type RoomCounts = {
  dares: number;
  bets: number;
  truthAnswered: boolean;
  jar: number;
  bombs: number;
  prophecies: number;
  nextCheckpoint: number | null;
  skins: number;
  tracks: number;
};

type Loaded = {
  bombs: BombView[];
  answers: TruthAnswer[];
  dares: Dare[];
  bets: Bet[];
  prophecies: Prophecy[];
  sealed: number;
  jar: number;
  skins: Skin[];
  tracks: Track[];
  checkpoints: CheckpointView[];
  opened: boolean;
};

/**
 * Whose move a dare is, which is not simply "the dared person": a counter goes BACK to the
 * darer, because resolveNegotiation refuses anyone else ("Only the darer can answer a
 * counter", repo/dares.ts:90). An accepted dare stays with the dared person, who is the only
 * one doneDareAction will let finish it.
 */
function dareOwner(d: Dare): MemberId | null {
  if (d.status === "open" || d.status === "accepted") return d.dared;
  if (d.status === "negotiating") return d.darer;
  return null;
}

async function load(db: Db, seasonId: number, me: MemberId, day: number): Promise<Loaded> {
  const opened = day >= TOTAL_DAYS;
  const [bombs, answers, dares, bets, prophecies, sealed, jar, skins, tracks, checkpoints] =
    await Promise.all([
      bombsFor(db, seasonId, me, day),
      answersFor(db, seasonId, day),
      listDares(db, seasonId),
      listBets(db, seasonId),
      opened ? listAll(db, seasonId) : Promise.resolve([] as Prophecy[]),
      countAll(db, seasonId),
      listJar(db, seasonId),
      listSkins(db, seasonId),
      listTracks(db, seasonId),
      checkpointViews(db, seasonId),
    ]);
  return {
    bombs,
    answers,
    dares,
    bets,
    prophecies,
    sealed,
    jar: jar.length,
    skins,
    tracks,
    checkpoints,
    opened,
  };
}

export function deriveOutstanding(
  l: Loaded,
  me: MemberId,
  members: MembersMap,
  day: number,
): Outstanding {
  const mine: Move[] = [];
  const stalled = new Map<WaitKind, { count: number; who: Set<MemberId> }>();
  const bump = (k: WaitKind, ...who: MemberId[]) => {
    const s = stalled.get(k) ?? { count: 0, who: new Set<MemberId>() };
    s.count += 1;
    for (const w of who) s.who.add(w);
    stalled.set(k, s);
  };
  const coming: Coming[] = [];

  const question = questionFor(day);
  const iAnswered = l.answers.some((a) => a.author === me);
  const unanswered = memberIds(members).filter((m) => !l.answers.some((a) => a.author === m));
  // The question only. No answer rows: everything handed to a client component crosses into
  // the page payload whether or not it is rendered, so passing them would put an unanswered
  // truth into the HTML of every wall load. This row only exists when you have not answered,
  // so there is no draft of your own to carry either.
  if (question !== null && !iAnswered) mine.push({ kind: "truth", question });
  if (question !== null && iAnswered && unanswered.length > 0) bump("truth", ...unanswered);

  for (const d of l.dares) {
    const owner = dareOwner(d);
    if (owner === null) continue;
    if (owner === me) mine.push({ kind: "dare", dare: d });
    else if (d.darer === me || d.dared === me) bump("dare", owner);
  }

  let openBets = 0;
  for (const b of l.bets) {
    if (b.proposer !== me && b.opponent !== me) continue;
    // Accepted and running. Neither party owes a move until one of them concedes, so it
    // belongs in the forward view rather than in anyone's tray, but it must not vanish.
    if (b.status === "open") openBets += 1;
    if (b.status !== "proposed") continue;
    if (b.opponent === me) mine.push({ kind: "bet", bet: b });
    else bump("bet", b.opponent);
  }
  if (openBets > 0) coming.push({ kind: "bet", open: openBets });

  for (const b of l.bombs) {
    if (b.detonated) continue;
    if (!b.due) {
      coming.push({ kind: "bomb", bomb: b });
      continue;
    }
    if (b.recipient === me) mine.push({ kind: "bomb", bomb: b });
    else if (b.sender === me) bump("bomb", b.recipient);
  }

  if (l.opened) {
    for (const p of l.prophecies) {
      if (p.verdict !== null) continue;
      if (p.about === me) mine.push({ kind: "prophecy", prophecy: p });
      else if (p.author === me) bump("prophecy", p.about);
    }
  } else if (l.sealed > 0) {
    coming.push({ kind: "prophecy", sealed: l.sealed });
  }

  const pending = l.checkpoints.find((v) => v.checkpoint.postId === null);
  if (pending)
    mine.push({ kind: "checkpoint", id: pending.checkpoint.id, day: pending.checkpoint.day });

  const next = CHECKPOINTS.find((d) => d > day);
  if (next !== undefined) coming.push({ kind: "checkpoint", day: next, away: next - day });

  const order = memberIds(members);
  const theirs = [...stalled].map(([kind, s]) => ({
    kind,
    count: s.count,
    who: order.filter((m) => s.who.has(m)),
  }));
  return { mine, theirs, coming };
}

export function deriveCounts(l: Loaded, me: MemberId, day: number): RoomCounts {
  return {
    dares: l.dares.filter((d) => dareOwner(d) !== null).length,
    bets: l.bets.filter((b) => b.status === "proposed" || b.status === "open").length,
    truthAnswered: l.answers.some((a) => a.author === me),
    jar: l.jar,
    // Armed means still counting down. A due one is in the tray, not waiting here.
    bombs: l.bombs.filter((b) => !b.detonated && !b.due).length,
    prophecies: l.opened ? l.prophecies.filter((p) => p.verdict === null).length : l.sealed,
    nextCheckpoint: CHECKPOINTS.find((d) => d > day) ?? null,
    skins: l.skins.length,
    tracks: l.tracks.length,
  };
}

/** One load, both views, plus the skins the tray's forms need. This is what the wall calls. */
export async function wallState(
  db: Db,
  seasonId: number,
  me: MemberId,
  members: MembersMap,
  day: number,
): Promise<{ moves: Outstanding; counts: RoomCounts; skins: Skin[] }> {
  const l = await load(db, seasonId, me, day);
  return {
    moves: deriveOutstanding(l, me, members, day),
    counts: deriveCounts(l, me, day),
    skins: l.skins,
  };
}

/** Kept for the tests and any caller that needs only the tray. */
export async function outstanding(
  db: Db,
  seasonId: number,
  me: MemberId,
  members: MembersMap,
  day: number,
): Promise<Outstanding> {
  return deriveOutstanding(await load(db, seasonId, me, day), me, members, day);
}
