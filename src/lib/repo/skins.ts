import { and, asc, count, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import {
  PAPERS,
  PATTERNS,
  type Paper,
  type Pattern,
  posts,
  type Skin,
  skins,
} from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

export const SKIN_NAME_MAX = 40;

export async function listSkins(db: Db, seasonId: number): Promise<Skin[]> {
  return db.select().from(skins).where(eq(skins.seasonId, seasonId)).orderBy(asc(skins.id));
}

export async function createSkin(
  db: Db,
  input: {
    seasonId: number;
    owner: MemberId;
    name: string;
    portraitUrl?: string;
    line?: string;
    paper?: Paper;
    pattern?: Pattern;
  },
): Promise<Skin> {
  const name = input.name.trim();
  if (name.length === 0 || name.length > SKIN_NAME_MAX)
    throw new Error(`Skin name must be 1 to ${SKIN_NAME_MAX} characters`);
  const line = input.line?.trim() || null;
  // Checked, not trusted: these come from a client, and posts.source sets the precedent for
  // policing a text column against its allowlist rather than relying on the type alone.
  if (input.paper && !PAPERS.includes(input.paper)) throw new Error("Unknown paper");
  if (input.pattern && !PATTERNS.includes(input.pattern)) throw new Error("Unknown pattern");
  const [skin] = await db
    .insert(skins)
    .values({
      seasonId: input.seasonId,
      owner: input.owner,
      name,
      portraitUrl: input.portraitUrl ?? null,
      line,
      paper: input.paper ?? null,
      pattern: input.pattern ?? null,
    })
    .returning();
  return skin;
}

export async function skinById(db: Db, id: number): Promise<Skin | undefined> {
  const [skin] = await db.select().from(skins).where(eq(skins.id, id)).limit(1);
  return skin;
}

async function owned(db: Db, id: number, owner: MemberId): Promise<Skin> {
  const skin = await skinById(db, id);
  if (!skin) throw new Error("No such skin");
  if (skin.owner !== owner) throw new Error("Only the author can do that");
  return skin;
}

/**
 * Edits apply everywhere the skin is already joined in live, including posted scraps: skins
 * are read at render time, not snapshotted onto a post, so an in-place update is all this is.
 */
export async function updateSkin(
  db: Db,
  id: number,
  owner: MemberId,
  input: { name?: string; line?: string; paper?: Paper; pattern?: Pattern },
): Promise<Skin> {
  const existing = await owned(db, id, owner);
  // Same checks as createSkin, applied only to whichever fields this call actually sends.
  const set: Partial<typeof skins.$inferInsert> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length === 0 || name.length > SKIN_NAME_MAX)
      throw new Error(`Skin name must be 1 to ${SKIN_NAME_MAX} characters`);
    set.name = name;
  }
  if (input.line !== undefined) set.line = input.line.trim() || null;
  if (input.paper !== undefined) {
    if (!PAPERS.includes(input.paper)) throw new Error("Unknown paper");
    set.paper = input.paper;
  }
  if (input.pattern !== undefined) {
    if (!PATTERNS.includes(input.pattern)) throw new Error("Unknown pattern");
    set.pattern = input.pattern;
  }
  if (Object.keys(set).length === 0) return existing;
  const [skin] = await db.update(skins).set(set).where(eq(skins.id, id)).returning();
  return skin;
}

/** Posts per skin in one query, for the card's rarity corner. A skin belongs to an entry. */
export async function skinUseCounts(db: Db, seasonId: number): Promise<Map<number, number>> {
  const rows = await db
    .select({ skinId: posts.skinId, n: count() })
    .from(posts)
    .where(and(eq(posts.seasonId, seasonId), isNull(posts.deletedAt)))
    .groupBy(posts.skinId);
  return new Map(rows.map((r) => [r.skinId, Number(r.n)]));
}
