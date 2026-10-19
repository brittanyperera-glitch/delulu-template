import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { type LinkMeta, type Track, tracks } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

/** Callable on its own so a caller can ask before writing anything else (e.g. a wall post). */
export async function trackUrlExists(db: Db, seasonId: number, url: string): Promise<boolean> {
  const dupe = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(and(eq(tracks.seasonId, seasonId), eq(tracks.url, url)))
    .limit(1);
  return dupe.length > 0;
}

export async function addTrack(
  db: Db,
  input: { seasonId: number; author: MemberId; day: number; meta: LinkMeta; postId?: number },
): Promise<Track> {
  if (await trackUrlExists(db, input.seasonId, input.meta.url))
    throw new Error("That track is already on the soundtrack");
  const [row] = await db
    .insert(tracks)
    .values({
      seasonId: input.seasonId,
      author: input.author,
      day: input.day,
      url: input.meta.url,
      title: input.meta.title,
      artist: input.meta.author ?? null,
      artUrl: input.meta.image ?? null,
      provider: input.meta.provider ?? null,
      postId: input.postId ?? null,
    })
    .returning();
  return row;
}

/** Oldest first: this is the order Day 100 plays them in. */
export async function listTracks(db: Db, seasonId: number): Promise<Track[]> {
  return db.select().from(tracks).where(eq(tracks.seasonId, seasonId)).orderBy(asc(tracks.id));
}

/** Still awaiting approval, oldest first: this is the order they get worked through. */
export async function listSuggestions(db: Db, seasonId: number): Promise<Track[]> {
  return db
    .select()
    .from(tracks)
    .where(and(eq(tracks.seasonId, seasonId), isNull(tracks.approvedAt)))
    .orderBy(asc(tracks.createdAt));
}

/** Promoted, in the order they were promoted: this is the order The Soundtrack plays them in. */
export async function listApproved(db: Db, seasonId: number): Promise<Track[]> {
  return db
    .select()
    .from(tracks)
    .where(and(eq(tracks.seasonId, seasonId), isNotNull(tracks.approvedAt)))
    .orderBy(asc(tracks.approvedAt));
}

async function trackById(db: Db, id: number, seasonId: number): Promise<Track | undefined> {
  const [row] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.seasonId, seasonId)))
    .limit(1);
  return row;
}

/**
 * Any member but the author approves a suggestion, promoting it to The Soundtrack. Guarded here, not in
 * the action, matching this repo's dominant convention (bombs.ts openBomb): the repo owns who
 * may do this, so a client can never approve its own suggestion by calling the action directly.
 */
export async function approveTrack(
  db: Db,
  input: { id: number; seasonId: number; viewer: MemberId },
  now: Date,
): Promise<Track> {
  const track = await trackById(db, input.id, input.seasonId);
  if (!track) throw new Error("No such track");
  if (input.viewer === track.author)
    throw new Error("Only the other person can add it to the soundtrack");
  // Already approved. Return it as-is rather than re-stamping approvedAt/approvedBy, so a
  // second tap can never move who gets credit for the promotion.
  if (track.approvedAt !== null) return track;
  const [row] = await db
    .update(tracks)
    .set({ approvedAt: now, approvedBy: input.viewer })
    // Guard on approvedAt too: if a concurrent approval already won, this updates nothing,
    // so who gets credit for the promotion can never move once it is set.
    .where(and(eq(tracks.id, track.id), isNull(tracks.approvedAt)))
    .returning();
  return row ?? (await trackById(db, track.id, input.seasonId)) ?? track;
}
