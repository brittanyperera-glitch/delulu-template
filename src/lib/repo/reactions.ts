import { and, eq } from "drizzle-orm";
import { STRINGS } from "@/lib/content/strings";
import type { Db } from "@/lib/db/client";
import { type Comment, comments, reactions } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

export const REACTIONS = STRINGS.reactions;
export const COMMENT_MAX = 280;

export async function toggleReaction(
  db: Db,
  postId: number,
  author: MemberId,
  word: string,
): Promise<"added" | "removed"> {
  if (!(REACTIONS as readonly string[]).includes(word)) throw new Error(`Unknown reaction ${word}`);
  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(
      and(eq(reactions.postId, postId), eq(reactions.author, author), eq(reactions.word, word)),
    )
    .limit(1);
  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
    return "removed";
  }
  await db.insert(reactions).values({ postId, author, word });
  return "added";
}

export async function addComment(
  db: Db,
  postId: number,
  author: MemberId,
  body: string,
): Promise<Comment> {
  const trimmed = body.trim();
  if (trimmed.length === 0 || trimmed.length > COMMENT_MAX)
    throw new Error(`A comment is 1 to ${COMMENT_MAX} characters`);
  const [c] = await db.insert(comments).values({ postId, author, body: trimmed }).returning();
  return c;
}
