import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { type Spoiler, spoilers } from "@/lib/db/schema";

export const SPOILER_LINE_MAX = 80;

/** One shared board: no owner. The skin is optional and belongs to this image. */
export async function addSpoiler(
  db: Db,
  input: { seasonId: number; imageUrl: string; line?: string; skinId?: number },
): Promise<Spoiler> {
  const imageUrl = input.imageUrl.trim();
  if (imageUrl.length === 0) throw new Error("A spoiler needs its image");
  const line = input.line?.trim() || null;
  if (line && line.length > SPOILER_LINE_MAX)
    throw new Error(`A line stops at ${SPOILER_LINE_MAX} characters`);
  const [s] = await db
    .insert(spoilers)
    .values({ seasonId: input.seasonId, imageUrl, line, skinId: input.skinId ?? null })
    .returning();
  return s;
}

export async function listSpoilers(db: Db, seasonId: number): Promise<Spoiler[]> {
  return db
    .select()
    .from(spoilers)
    .where(eq(spoilers.seasonId, seasonId))
    .orderBy(desc(spoilers.id));
}

export async function claimHappened(
  db: Db,
  id: number,
  day: number,
  postId: number,
): Promise<{ id: number }[]> {
  return db
    .update(spoilers)
    .set({ happenedDay: day, postId })
    .where(and(eq(spoilers.id, id), isNull(spoilers.happenedDay)))
    .returning({ id: spoilers.id });
}
