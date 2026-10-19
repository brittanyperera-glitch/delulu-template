import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { type Delusion, delusions } from "@/lib/db/schema";
import { type MemberId, memberExists } from "@/lib/members";

export const DELUSION_MAX = 120;

/** One shared list: `about` is who it is about, `addedBy` is who wrote it, `skinId` is optional. */
export async function addDelusion(
  db: Db,
  input: { seasonId: number; about: MemberId; addedBy: MemberId; body: string; skinId?: number },
): Promise<Delusion> {
  const body = input.body.trim();
  if (body.length === 0 || body.length > DELUSION_MAX)
    throw new Error(`A delusion must be 1 to ${DELUSION_MAX} characters`);
  if (!(await memberExists(db, input.about))) throw new Error("No such member");
  const [d] = await db
    .insert(delusions)
    .values({ ...input, body })
    .returning();
  return d;
}

export async function listDelusions(db: Db, seasonId: number): Promise<Delusion[]> {
  return db
    .select()
    .from(delusions)
    .where(eq(delusions.seasonId, seasonId))
    .orderBy(asc(delusions.id));
}

/** The claim half of postAndClaim: first flip wins, a second sees it already flipped. */
export async function claimTrululu(
  db: Db,
  id: number,
  postId: number,
  day: number,
): Promise<{ id: number }[]> {
  return db
    .update(delusions)
    .set({ trululuPostId: postId, trululuDay: day })
    .where(and(eq(delusions.id, id), isNull(delusions.trululuPostId)))
    .returning({ id: delusions.id });
}

/** post id to delusion line, for the line the pages spec prints over each Trululu scrap. */
export async function trululuLines(db: Db, seasonId: number): Promise<Map<number, string>> {
  const rows = await db
    .select({ postId: delusions.trululuPostId, body: delusions.body })
    .from(delusions)
    .where(and(eq(delusions.seasonId, seasonId), isNotNull(delusions.trululuPostId)));
  return new Map(
    rows.flatMap((r) => (r.postId === null ? [] : [[r.postId, r.body] as [number, string]])),
  );
}
