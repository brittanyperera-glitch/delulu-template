import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { type LinkMeta, type Post, posts, skins } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";
import { AUTO_STAMPS, createPost, type SectionSource } from "@/lib/repo/posts";

export type SectionPost = {
  seasonId: number;
  author: MemberId;
  skinId: number;
  source: SectionSource;
  type: Post["type"];
  body?: string;
  mediaUrl?: string;
  linkMeta?: LinkMeta;
};

export async function postFromSection(
  db: Db,
  input: SectionPost,
  now: Date = new Date(),
): Promise<Post> {
  return createPost(db, { ...input, stamps: [AUTO_STAMPS[input.source]] }, now);
}

export async function discardPost(db: Db, postId: number): Promise<void> {
  await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, postId));
}

/**
 * The post and the row that records it are two statements, and the neon-http driver has no
 * interactive transaction. So write the post, then claim the row with its own precondition.
 * A claim that matches no row means another writer settled this first: our post goes away
 * and the caller gets null, so the wall never shows the same event twice.
 */
export async function postAndClaim(
  db: Db,
  input: SectionPost,
  claim: (postId: number) => Promise<unknown[]>,
  now: Date = new Date(),
): Promise<Post | null> {
  const post = await postFromSection(db, input, now);
  const rows = await claim(post.id);
  if (rows.length === 0) {
    await discardPost(db, post.id);
    return null;
  }
  return post;
}

/**
 * The skin a section posts under by default: the last one this player posted with, else their
 * newest skin. There is no wear to read, because a skin belongs to an entry and not to a day.
 */
export async function defaultSkinId(
  db: Db,
  seasonId: number,
  player: MemberId,
): Promise<number | null> {
  const [last] = await db
    .select({ id: posts.skinId })
    .from(posts)
    .where(and(eq(posts.seasonId, seasonId), eq(posts.author, player), isNull(posts.deletedAt)))
    .orderBy(desc(posts.id))
    .limit(1);
  if (last) return last.id;
  const [newest] = await db
    .select({ id: skins.id })
    .from(skins)
    .where(and(eq(skins.seasonId, seasonId), eq(skins.owner, player)))
    .orderBy(desc(skins.id))
    .limit(1);
  return newest?.id ?? null;
}
