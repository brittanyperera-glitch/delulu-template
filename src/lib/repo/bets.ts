import { and, desc, eq } from "drizzle-orm";
import { STRINGS } from "@/lib/content/strings";
import type { Db } from "@/lib/db/client";
import { type Bet, bets } from "@/lib/db/schema";
import { type MemberId, type MembersMap, memberExists, nameOf } from "@/lib/members";

export const CLAIM_MAX = 200;
export const STAKES_MAX = 120;

export async function proposeBet(
  db: Db,
  input: {
    seasonId: number;
    proposer: MemberId;
    opponent: MemberId;
    claim: string;
    stakes: string;
  },
): Promise<Bet> {
  const claim = input.claim.trim();
  const stakes = input.stakes.trim();
  if (claim.length === 0 || claim.length > CLAIM_MAX)
    throw new Error(`A claim must be 1 to ${CLAIM_MAX} characters`);
  if (stakes.length === 0 || stakes.length > STAKES_MAX)
    throw new Error(`The stakes must be 1 to ${STAKES_MAX} characters`);
  if (input.opponent === input.proposer) throw new Error("You cannot bet against yourself");
  if (!(await memberExists(db, input.opponent))) throw new Error("No such member");
  const [bet] = await db
    .insert(bets)
    .values({
      seasonId: input.seasonId,
      proposer: input.proposer,
      opponent: input.opponent,
      claim,
      stakes,
    })
    .returning();
  return bet;
}

export async function listBets(db: Db, seasonId: number): Promise<Bet[]> {
  return db.select().from(bets).where(eq(bets.seasonId, seasonId)).orderBy(desc(bets.id));
}

export async function betById(db: Db, id: number): Promise<Bet | undefined> {
  const [bet] = await db.select().from(bets).where(eq(bets.id, id)).limit(1);
  return bet;
}

async function answer(
  db: Db,
  id: number,
  player: MemberId,
  status: "open" | "declined",
): Promise<void> {
  const bet = await betById(db, id);
  if (!bet) throw new Error("No such bet");
  if (player !== bet.opponent) throw new Error("Only the other party answers a bet");
  const done = await db
    .update(bets)
    .set({ status })
    .where(and(eq(bets.id, id), eq(bets.status, "proposed")))
    .returning({ id: bets.id });
  if (done.length === 0) throw new Error("That bet has already moved on");
}

export async function acceptBet(db: Db, id: number, player: MemberId): Promise<void> {
  await answer(db, id, player, "open");
}

export async function declineBet(db: Db, id: number, player: MemberId): Promise<void> {
  await answer(db, id, player, "declined");
}

/** Conditional on open, so if both of you settle at once the first write wins. */
export async function claimSettled(
  db: Db,
  id: number,
  loser: MemberId,
  postId: number,
  day: number,
): Promise<{ id: number }[]> {
  return db
    .update(bets)
    .set({ status: "settled", loser, receiptPostId: postId, settledDay: day })
    .where(and(eq(bets.id, id), eq(bets.status, "open")))
    .returning({ id: bets.id });
}

export function receiptBody(bet: Bet, loser: MemberId, members: MembersMap): string {
  return `${STRINGS.bets.receipt}. ${bet.claim}. ${STRINGS.bets.paid} ${nameOf(members, loser)}: ${bet.stakes}`;
}
