import { and, arrayContains, asc, count, countDistinct, eq, gte, isNull, lte } from "drizzle-orm";
import { STRINGS } from "@/lib/content/strings";
import { CHECKPOINTS } from "@/lib/days";
import type { Db } from "@/lib/db/client";
import {
  type Checkpoint,
  checkpoints,
  type JarItem,
  jarItems,
  posts,
  type Recap,
  reactions,
} from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";
import { drawFromJar, putBack } from "@/lib/repo/jar";
import { AUTO_STAMPS } from "@/lib/repo/posts";
import { defaultSkinId, postAndClaim } from "@/lib/repo/section-post";

/** The stretch a Checkpoint covers: the day after the previous one, through this one. Day 10 covers 1 to 10. */
export function periodFor(day: number): { from: number; to: number } {
  const at = (CHECKPOINTS as readonly number[]).indexOf(day);
  if (at < 0) throw new Error(`Day ${day} is not a Checkpoint`);
  return { from: at === 0 ? 1 : CHECKPOINTS[at - 1] + 1, to: day };
}

export async function buildRecap(
  db: Db,
  seasonId: number,
  from: number,
  to: number,
): Promise<Recap> {
  const inPeriod = and(
    eq(posts.seasonId, seasonId),
    isNull(posts.deletedAt),
    gte(posts.day, from),
    lte(posts.day, to),
  );
  const stampCount = async (stamp: string): Promise<number> => {
    const [row] = await db
      .select({ n: count() })
      .from(posts)
      .where(and(inPeriod, arrayContains(posts.stamps, [stamp])));
    return Number(row?.n ?? 0);
  };
  const [totalRow] = await db.select({ n: count() }).from(posts).where(inPeriod);
  const trululus = await stampCount(AUTO_STAMPS.delusion);
  const ws = await stampCount("W");
  const ls = await stampCount("L");
  // Skins used, not worn: the distinct skins the posts in this stretch were made under.
  const [skinsRow] = await db
    .select({ n: countDistinct(posts.skinId) })
    .from(posts)
    .where(inPeriod);
  const reacted = await db
    .select({ postId: reactions.postId, n: count() })
    .from(reactions)
    .innerJoin(posts, eq(posts.id, reactions.postId))
    .where(inPeriod)
    .groupBy(reactions.postId);
  // Most reacted wins; a tie goes to the lower post id, so the pick never depends on query order.
  const top = reacted.reduce<{ postId: number; n: number } | null>((best, row) => {
    const n = Number(row.n);
    return !best || n > best.n || (n === best.n && row.postId < best.postId)
      ? { postId: row.postId, n }
      : best;
  }, null);
  return {
    from,
    to,
    posts: Number(totalRow?.n ?? 0),
    trululus,
    ws,
    ls,
    skinsUsed: Number(skinsRow?.n ?? 0),
    topPostId: top?.postId ?? null,
  };
}

export type CheckpointView = { checkpoint: Checkpoint; feral: JarItem | null };

export async function checkpointViews(db: Db, seasonId: number): Promise<CheckpointView[]> {
  const rows = await db
    .select({ checkpoint: checkpoints, feral: jarItems })
    .from(checkpoints)
    .leftJoin(jarItems, eq(jarItems.id, checkpoints.jarItemId))
    .where(eq(checkpoints.seasonId, seasonId))
    .orderBy(asc(checkpoints.day));
  return rows.map((r) => ({ checkpoint: r.checkpoint, feral: r.feral ?? null }));
}

export function recapBody(recap: Recap, drawn: JarItem | null): string {
  const tally = STRINGS.checkpoints.tally(
    recap.posts,
    recap.trululus,
    recap.ws,
    recap.ls,
    recap.skinsUsed,
  );
  return drawn
    ? `${tally}. ${STRINGS.checkpoints.bonusLine(drawn.body)}`
    : `${tally}. ${STRINGS.checkpoints.emptyFeral}`;
}

/**
 * Opens one Checkpoint: builds its recap, forces a Feral draw, and posts both to the wall in
 * one go. Conditional on postId still null, so two opens at once leave one post; the loser's
 * Feral draw goes back in the jar rather than sitting outside it with nothing to show for it.
 */
export async function openCheckpoint(
  db: Db,
  seasonId: number,
  id: number,
  player: MemberId,
  now: Date = new Date(),
  rand: () => number = Math.random,
): Promise<Checkpoint> {
  const [row] = await db
    .select()
    .from(checkpoints)
    .where(and(eq(checkpoints.id, id), eq(checkpoints.seasonId, seasonId)))
    .limit(1);
  if (!row) throw new Error("No such Checkpoint");
  if (row.postId !== null) return row;
  // The opener's own last skin, whatever day they open on: a Checkpoint can be opened days late.
  const skinId = await defaultSkinId(db, seasonId, player);
  if (skinId === null) throw new Error("Make a skin before opening a Checkpoint");
  const { from, to } = periodFor(row.day);
  const recap = await buildRecap(db, seasonId, from, to);
  const drawn = await drawFromJar(db, seasonId, "feral", player, now, rand);
  const post = await postAndClaim(
    db,
    {
      seasonId,
      author: player,
      skinId,
      source: "checkpoint",
      type: "text",
      body: recapBody(recap, drawn),
    },
    (postId) =>
      db
        .update(checkpoints)
        .set({ recapJson: recap, jarItemId: drawn?.id ?? null, openedBy: player, postId })
        .where(and(eq(checkpoints.id, id), isNull(checkpoints.postId)))
        .returning({ id: checkpoints.id }),
    now,
  );
  if (!post && drawn) await putBack(db, drawn.id, player);
  const [current] = await db.select().from(checkpoints).where(eq(checkpoints.id, id)).limit(1);
  if (!current) throw new Error("No such Checkpoint");
  return current;
}
