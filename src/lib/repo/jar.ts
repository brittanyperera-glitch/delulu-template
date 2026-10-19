import { and, asc, count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { type JarItem, type JarSize, jarItems } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

export const JAR_SIZES: readonly JarSize[] = ["tiny", "tonight", "weekend", "planning", "feral"];
export const QUEST_MAX = 140;

export async function addJarItem(
  db: Db,
  input: { seasonId: number; author: MemberId; body: string; size: JarSize },
): Promise<JarItem> {
  const body = input.body.trim();
  if (body.length === 0 || body.length > QUEST_MAX)
    throw new Error(`A quest must be 1 to ${QUEST_MAX} characters`);
  const [item] = await db
    .insert(jarItems)
    .values({ ...input, body })
    .returning();
  return item;
}

export async function listJar(db: Db, seasonId: number): Promise<JarItem[]> {
  return db
    .select()
    .from(jarItems)
    .where(eq(jarItems.seasonId, seasonId))
    .orderBy(asc(jarItems.id));
}

/** What the jar still holds: undrawn and not done. A drawn slip is out of the jar. */
export async function countsBySize(db: Db, seasonId: number): Promise<Record<JarSize, number>> {
  const rows = await db
    .select({ size: jarItems.size, n: count() })
    .from(jarItems)
    .where(
      and(eq(jarItems.seasonId, seasonId), isNull(jarItems.drawnAt), isNull(jarItems.donePostId)),
    )
    .groupBy(jarItems.size);
  const out = Object.fromEntries(JAR_SIZES.map((s) => [s, 0])) as Record<JarSize, number>;
  for (const r of rows) out[r.size] = Number(r.n);
  return out;
}

/**
 * Pick at random inside one size, then claim the slip with its own precondition. A claim that
 * matches no row means the other player drew it in the same moment, so try the next candidate.
 */
export async function drawFromJar(
  db: Db,
  seasonId: number,
  size: JarSize,
  player: MemberId,
  now: Date = new Date(),
  rand: () => number = Math.random,
): Promise<JarItem | null> {
  const pool = await db
    .select()
    .from(jarItems)
    .where(
      and(
        eq(jarItems.seasonId, seasonId),
        eq(jarItems.size, size),
        isNull(jarItems.drawnAt),
        isNull(jarItems.donePostId),
      ),
    );
  const remaining = [...pool];
  while (remaining.length > 0) {
    const i = Math.min(remaining.length - 1, Math.floor(rand() * remaining.length));
    const [pick] = remaining.splice(i, 1);
    const [claimed] = await db
      .update(jarItems)
      .set({ drawnAt: now, drawnBy: player })
      .where(and(eq(jarItems.id, pick.id), isNull(jarItems.drawnAt), isNull(jarItems.donePostId)))
      .returning();
    if (claimed) return claimed;
  }
  return null;
}

export async function drawnFor(
  db: Db,
  seasonId: number,
  player: MemberId,
): Promise<JarItem | null> {
  const [item] = await db
    .select()
    .from(jarItems)
    .where(
      and(
        eq(jarItems.seasonId, seasonId),
        eq(jarItems.drawnBy, player),
        isNotNull(jarItems.drawnAt),
        isNull(jarItems.donePostId),
      ),
    )
    .orderBy(asc(jarItems.id))
    .limit(1);
  return item ?? null;
}

export async function putBack(db: Db, id: number, player: MemberId): Promise<void> {
  await db
    .update(jarItems)
    .set({ drawnAt: null, drawnBy: null, putBackCount: sql`${jarItems.putBackCount} + 1` })
    .where(and(eq(jarItems.id, id), eq(jarItems.drawnBy, player), isNull(jarItems.donePostId)));
}

export async function claimDone(
  db: Db,
  id: number,
  postId: number,
  day: number,
): Promise<{ id: number }[]> {
  return db
    .update(jarItems)
    .set({ donePostId: postId, doneDay: day })
    .where(and(eq(jarItems.id, id), isNull(jarItems.donePostId)))
    .returning({ id: jarItems.id });
}
