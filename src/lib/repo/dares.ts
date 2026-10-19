import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { type Dare, dares } from "@/lib/db/schema";
import { type MemberId, memberExists } from "@/lib/members";

export const DARE_MAX = 200;
export const STAKE_MAX = 80;

export async function proposeDare(
  db: Db,
  input: { seasonId: number; darer: MemberId; dared: MemberId; body: string; stake?: string },
): Promise<Dare> {
  const body = input.body.trim();
  if (body.length === 0 || body.length > DARE_MAX)
    throw new Error(`A dare must be 1 to ${DARE_MAX} characters`);
  const stake = input.stake?.trim() || null;
  if (stake && stake.length > STAKE_MAX)
    throw new Error(`A stake stops at ${STAKE_MAX} characters`);
  if (input.dared === input.darer) throw new Error("You cannot dare yourself");
  if (!(await memberExists(db, input.dared))) throw new Error("No such member");
  const [dare] = await db
    .insert(dares)
    .values({
      seasonId: input.seasonId,
      darer: input.darer,
      dared: input.dared,
      body,
      stake,
    })
    .returning();
  return dare;
}

export async function listDares(db: Db, seasonId: number): Promise<Dare[]> {
  return db.select().from(dares).where(eq(dares.seasonId, seasonId)).orderBy(desc(dares.id));
}

export async function dareById(db: Db, id: number): Promise<Dare | undefined> {
  const [dare] = await db.select().from(dares).where(eq(dares.id, id)).limit(1);
  return dare;
}

/** One conditional update per transition, so a stale page cannot reply twice. */
async function reply(
  db: Db,
  id: number,
  player: MemberId,
  set: Partial<Dare>,
  from: Dare["status"][],
): Promise<void> {
  const dare = await dareById(db, id);
  if (!dare) throw new Error("No such dare");
  if (dare.dared !== player) throw new Error("Only the dared person can reply");
  const done = await db
    .update(dares)
    .set(set)
    .where(and(eq(dares.id, id), eq(dares.dared, player), inArray(dares.status, from)))
    .returning({ id: dares.id });
  if (done.length === 0) throw new Error("That dare has already moved on");
}

export async function acceptDare(db: Db, id: number, player: MemberId): Promise<void> {
  await reply(db, id, player, { status: "accepted", counter: null }, ["open", "negotiating"]);
}

export async function chickenOut(db: Db, id: number, player: MemberId): Promise<void> {
  // Recorded permanently: there is no transition out of chickened.
  await reply(db, id, player, { status: "chickened", counter: null }, ["open", "negotiating"]);
}

export async function negotiateDare(
  db: Db,
  id: number,
  player: MemberId,
  counter: string,
): Promise<void> {
  const text = counter.trim();
  if (text.length === 0 || text.length > DARE_MAX)
    throw new Error(`A counter must be 1 to ${DARE_MAX} characters`);
  await reply(db, id, player, { status: "negotiating", counter: text }, ["open"]);
}

/** Taking the counter makes it the dare. Declining puts the dare back exactly as it was. */
export async function resolveNegotiation(
  db: Db,
  id: number,
  player: MemberId,
  accept: boolean,
): Promise<void> {
  const dare = await dareById(db, id);
  if (!dare) throw new Error("No such dare");
  if (dare.darer !== player) throw new Error("Only the darer can answer a counter");
  if (!dare.counter) throw new Error("There is no counter to answer");
  const set = accept
    ? { status: "accepted" as const, body: dare.counter, counter: null }
    : { status: "open" as const, counter: null };
  const done = await db
    .update(dares)
    .set(set)
    .where(and(eq(dares.id, id), eq(dares.status, "negotiating")))
    .returning({ id: dares.id });
  if (done.length === 0) throw new Error("That dare has already moved on");
}

export async function claimDareDone(
  db: Db,
  id: number,
  postId: number,
  day: number,
): Promise<{ id: number }[]> {
  return db
    .update(dares)
    .set({ status: "done", donePostId: postId, doneDay: day })
    .where(and(eq(dares.id, id), eq(dares.status, "accepted"), isNull(dares.donePostId)))
    .returning({ id: dares.id });
}
