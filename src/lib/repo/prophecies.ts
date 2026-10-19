import { and, asc, count, eq, ne } from "drizzle-orm";
import { propheciesSealed, TOTAL_DAYS } from "@/lib/days";
import type { Db } from "@/lib/db/client";
import { type Prophecy, prophecies, type Verdict } from "@/lib/db/schema";
import { type MemberId, memberExists } from "@/lib/members";

export const PROPHECY_MAX = 200;

export async function addProphecy(
  db: Db,
  input: { seasonId: number; author: MemberId; about: MemberId; body: string },
  day: number,
): Promise<Prophecy> {
  if (propheciesSealed(day)) throw new Error("The prophecies are sealed");
  const body = input.body.trim();
  if (body.length === 0 || body.length > PROPHECY_MAX)
    throw new Error(`A prophecy must be 1 to ${PROPHECY_MAX} characters`);
  if (!(await memberExists(db, input.about))) throw new Error("No such member");
  const [p] = await db
    .insert(prophecies)
    .values({ ...input, body, day })
    .returning();
  return p;
}

/** Your own, readable while you are still writing. The other person's are never listed until Day 100. */
export async function listMine(db: Db, seasonId: number, author: MemberId): Promise<Prophecy[]> {
  return db
    .select()
    .from(prophecies)
    .where(and(eq(prophecies.seasonId, seasonId), eq(prophecies.author, author)))
    .orderBy(asc(prophecies.id));
}

/** One sealed scroll, tagged with who wrote it. Never the body. */
export type SealedScroll = { id: number; author: MemberId };

/**
 * The other person's prophecies, as sealed scrolls: id and author only. The body is NOT
 * selected, so a prophecy the reader did not write cannot reach their screen before Day 100.
 * The withholding lives here, in the query, not in what the page happens to render.
 */
export async function listSealed(
  db: Db,
  seasonId: number,
  viewer: MemberId,
): Promise<SealedScroll[]> {
  return db
    .select({ id: prophecies.id, author: prophecies.author })
    .from(prophecies)
    .where(and(eq(prophecies.seasonId, seasonId), ne(prophecies.author, viewer)))
    .orderBy(asc(prophecies.id));
}

export async function countAll(db: Db, seasonId: number): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(prophecies)
    .where(eq(prophecies.seasonId, seasonId));
  return Number(row?.n ?? 0);
}

export async function listAll(db: Db, seasonId: number): Promise<Prophecy[]> {
  return db
    .select()
    .from(prophecies)
    .where(eq(prophecies.seasonId, seasonId))
    .orderBy(asc(prophecies.id));
}

export async function judge(
  db: Db,
  input: { id: number; by: MemberId; verdict: Verdict; day: number },
): Promise<void> {
  if (input.day < TOTAL_DAYS) throw new Error("Prophecies open on Day 100");
  const [p] = await db.select().from(prophecies).where(eq(prophecies.id, input.id)).limit(1);
  if (!p) throw new Error("No such prophecy");
  if (p.about !== input.by) throw new Error("Only the person it is about can judge it");
  await db
    .update(prophecies)
    .set({ verdict: input.verdict, verdictDay: input.day })
    .where(eq(prophecies.id, input.id));
}

export function tally(items: Prophecy[]): { fulfilled: number; delulu: number } {
  return {
    fulfilled: items.filter((p) => p.verdict === "fulfilled").length,
    delulu: items.filter((p) => p.verdict === "delulu").length,
  };
}
