import { asc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { type TrackComment, trackComments } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

export type TrackCommentThread = TrackComment & { replies: TrackComment[] };

export async function addTrackComment(
  db: Db,
  input: { trackId: number; author: MemberId; body: string; parentId?: number },
): Promise<TrackComment> {
  const [row] = await db
    .insert(trackComments)
    .values({
      trackId: input.trackId,
      author: input.author,
      body: input.body,
      parentId: input.parentId ?? null,
    })
    .returning();
  return row;
}

/**
 * Oldest first, grouped here (not in the component) into one level of replies: each top-level
 * comment carries its own replies, also oldest first.
 */
export async function listTrackComments(db: Db, trackId: number): Promise<TrackCommentThread[]> {
  const rows = await db
    .select()
    .from(trackComments)
    .where(eq(trackComments.trackId, trackId))
    .orderBy(asc(trackComments.createdAt));

  const repliesByParent = new Map<number, TrackComment[]>();
  for (const row of rows) {
    if (row.parentId === null) continue;
    const list = repliesByParent.get(row.parentId) ?? [];
    list.push(row);
    repliesByParent.set(row.parentId, list);
  }
  return rows
    .filter((row) => row.parentId === null)
    .map((row) => ({ ...row, replies: repliesByParent.get(row.id) ?? [] }));
}
