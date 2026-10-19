import { and, arrayContains, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { STRINGS } from "@/lib/content/strings";
import { dayNumber } from "@/lib/days";
import type { Db } from "@/lib/db/client";
import {
  type Comment,
  comments,
  type LinkMeta,
  PAPERS,
  type Paper,
  type Post,
  posts,
  type Reaction,
  reactions,
  type Skin,
  skins,
} from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";
import { seasonById } from "@/lib/repo/seasons";
import { MAX_SECONDS } from "@/lib/upload";

export const MANUAL_STAMPS = ["W", "L"] as const;

/** One stamp per section, written only by that section through postFromSection. */
export const AUTO_STAMPS = {
  delusion: "TRULULU",
  spoiler: "HAPPENED",
  jar: "FROM THE JAR",
  dare: "DARED",
  bet: "RECEIPT",
  bomb: "TIME BOMB",
  checkpoint: "CHECKPOINT",
} as const;

export type SectionSource = keyof typeof AUTO_STAMPS;
export const ALL_STAMPS: readonly string[] = [...MANUAL_STAMPS, ...Object.values(AUTO_STAMPS)];
export const TEXT_MAX = 2000;

export type NewPost = {
  seasonId: number;
  author: MemberId;
  skinId: number;
  type: Post["type"];
  body?: string;
  mediaUrl?: string;
  mediaSeconds?: number;
  linkMeta?: LinkMeta;
  stamps?: string[];
  source?: string;
  /** Overrides the skin's paper for this one scrap. Absent means inherit. */
  paper?: Paper;
};

export type WallItem = {
  post: Post;
  skin: Skin;
  reactions: Reaction[];
  /** Newest last. The wall shows only the latest as a peek; the post page shows the lot. */
  comments: Comment[];
  commentCount: number;
};

function validate(input: NewPost): { body: string | null } {
  const body = input.body?.trim() ?? "";
  // Policed against the allowlist rather than trusted, as source is: a paper arrives from a
  // client, and an unknown value would render as a scrap with no paper class at all.
  if (input.paper && !PAPERS.includes(input.paper)) throw new Error("Unknown paper");
  if (input.type === "text" && body.length === 0) throw new Error("A text post needs text");
  if (body.length > TEXT_MAX) throw new Error(`Text is over ${TEXT_MAX} characters`);
  if (
    (input.type === "photo" || input.type === "voice" || input.type === "video") &&
    !input.mediaUrl
  )
    throw new Error(`A ${input.type} post needs its ${input.type}`);
  if (input.type === "link" && !input.linkMeta?.url) throw new Error("A link post needs a link");
  if (input.type === "voice" && (input.mediaSeconds ?? 0) > MAX_SECONDS.voice)
    throw new Error(STRINGS.composer.tooLong.voice);
  if (input.type === "video" && (input.mediaSeconds ?? 0) > MAX_SECONDS.video)
    throw new Error(STRINGS.composer.tooLong.video);
  const auto = AUTO_STAMPS[input.source as SectionSource];
  for (const s of input.stamps ?? []) {
    if ((MANUAL_STAMPS as readonly string[]).includes(s)) continue;
    if (s === auto) continue;
    throw new Error(`Unknown stamp ${s}`);
  }
  return { body: body.length ? body : null };
}

export async function createPost(db: Db, input: NewPost, now: Date = new Date()): Promise<Post> {
  const { body } = validate(input);
  const [skin] = await db.select().from(skins).where(eq(skins.id, input.skinId)).limit(1);
  if (!skin || skin.seasonId !== input.seasonId || skin.owner !== input.author)
    throw new Error("Pick one of your own skins");
  const season = await seasonById(db, input.seasonId);
  if (!season) throw new Error("Unknown season");
  const [post] = await db
    .insert(posts)
    .values({
      seasonId: input.seasonId,
      author: input.author,
      day: dayNumber(now, season.dayOne, season.timezone),
      skinId: input.skinId,
      type: input.type,
      body,
      mediaUrl: input.mediaUrl ?? null,
      mediaSeconds: input.mediaSeconds ?? null,
      linkMeta: input.linkMeta ?? null,
      stamps: [...new Set(input.stamps ?? [])],
      source: input.source ?? "manual",
      paper: input.paper ?? null,
    })
    .returning();
  return post;
}

async function decorate(db: Db, rows: { post: Post; skin: Skin }[]): Promise<WallItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.post.id);
  const rx = await db.select().from(reactions).where(inArray(reactions.postId, ids));
  // Bodies, not a count: the wall's small scrap peeks the latest one, and the post page
  // needs the lot, so one query of the real rows serves both instead of a count() plus a
  // second fetch on the post page.
  const cm = await db
    .select()
    .from(comments)
    .where(inArray(comments.postId, ids))
    .orderBy(comments.id);
  return rows.map((r) => {
    const postComments = cm.filter((c) => c.postId === r.post.id);
    return {
      ...r,
      reactions: rx.filter((x) => x.postId === r.post.id),
      comments: postComments,
      commentCount: postComments.length,
    };
  });
}

export async function listWall(
  db: Db,
  seasonId: number,
  opts: {
    limit?: number;
    before?: number;
    stamp?: string;
    skinId?: number;
  } = {},
): Promise<WallItem[]> {
  const where = [eq(posts.seasonId, seasonId), isNull(posts.deletedAt), isNull(posts.hiddenAt)];
  if (opts.before) where.push(lt(posts.id, opts.before));
  if (opts.stamp) where.push(arrayContains(posts.stamps, [opts.stamp]));
  if (opts.skinId) where.push(eq(posts.skinId, opts.skinId));
  const rows = await db
    .select({ post: posts, skin: skins })
    .from(posts)
    .innerJoin(skins, eq(skins.id, posts.skinId))
    .where(and(...where))
    .orderBy(desc(posts.id))
    .limit(opts.limit ?? 20);
  return decorate(db, rows);
}

export async function getPost(db: Db, id: number): Promise<WallItem | null> {
  const rows = await db
    .select({ post: posts, skin: skins })
    .from(posts)
    .innerJoin(skins, eq(skins.id, posts.skinId))
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1);
  if (rows.length === 0) return null;
  // decorate() already fetches every comment on these ids, so a single post's full thread is
  // already the same query as the wall's peek: no second fetch of the same rows.
  const [item] = await decorate(db, rows);
  return item;
}

async function owned(db: Db, id: number, author: MemberId): Promise<Post> {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
    .limit(1);
  if (!post) throw new Error("No such post");
  if (post.author !== author) throw new Error("Only the author can do that");
  return post;
}

export async function editPost(
  db: Db,
  id: number,
  author: MemberId,
  input: { body: string; media?: { url: string; type: Post["type"]; seconds?: number } },
): Promise<void> {
  const existing = await owned(db, id, author);
  const trimmed = input.body.trim();
  if (trimmed.length > TEXT_MAX) throw new Error("A post is too long");
  // A post must still say something: after this edit it needs text, media just attached, or
  // media it already carried. Only a text post with the words removed is empty.
  const willHaveMedia = input.media != null || existing.type !== "text";
  if (trimmed.length === 0 && !willHaveMedia) throw new Error("A post needs text or media");
  await db
    .update(posts)
    .set({
      body: trimmed || null,
      updatedAt: new Date(),
      ...(input.media
        ? {
            type: input.media.type,
            mediaUrl: input.media.url,
            mediaSeconds: input.media.seconds ?? null,
          }
        : {}),
    })
    .where(eq(posts.id, id));
}

export async function deletePost(db: Db, id: number, author: MemberId): Promise<void> {
  await owned(db, id, author);
  await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, id));
}

/** Hidden is reversible and keeps the row: the post leaves the wall until its author unhides it. */
export async function setHidden(
  db: Db,
  id: number,
  author: MemberId,
  hidden: boolean,
): Promise<void> {
  await owned(db, id, author);
  await db
    .update(posts)
    .set({ hiddenAt: hidden ? new Date() : null })
    .where(eq(posts.id, id));
}

export function tiltFor(row: { id: number }): number {
  return ((row.id * 37) % 50) / 10 - 2.5;
}

/** For a post that already exists: a Trululu chosen from the wall, not written for it. */
export async function addStamp(db: Db, postId: number, stamp: string): Promise<void> {
  if (!ALL_STAMPS.includes(stamp)) throw new Error(`Unknown stamp ${stamp}`);
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);
  if (!post) throw new Error("No such post");
  if (post.stamps.includes(stamp)) return;
  await db
    .update(posts)
    .set({ stamps: [...post.stamps, stamp] })
    .where(eq(posts.id, postId));
}
