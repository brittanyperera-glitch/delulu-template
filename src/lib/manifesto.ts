import { desc, eq } from "drizzle-orm";
import { SITE } from "@/config/site";
import type { Db } from "@/lib/db/client";
import { type ManifestoVersion, manifestoVersions } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

export function sentences(body: string): string[] {
  return body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function pickSentence(body: string, rand: number): string {
  const xs = sentences(body);
  if (xs.length === 0) return "Delulu season.";
  return xs[Math.min(xs.length - 1, Math.floor(rand * xs.length))];
}

export async function currentManifesto(db: Db, seasonId: number): Promise<string> {
  const [v] = await db
    .select()
    .from(manifestoVersions)
    .where(eq(manifestoVersions.seasonId, seasonId))
    .orderBy(desc(manifestoVersions.id))
    .limit(1);
  return v?.body ?? "";
}

export const MANIFESTO_V1 = [
  `We are so back. ${SITE.name} starts today.`,
  "Because we had a revelation: we can literally do anything. Everything, even.",
  "Maybe we are being manic but we are going to ______, ______ and ______.",
  "If someone else can, why can't we? Even better, be the first.",
  "One day we will ______. How, we don't know yet, but it'll happen.",
  "So today it begins. Rewrite all of this together.",
].join("\n");

export const MANIFESTO_MAX = 4000;

export async function listVersions(db: Db, seasonId: number): Promise<ManifestoVersion[]> {
  return db
    .select()
    .from(manifestoVersions)
    .where(eq(manifestoVersions.seasonId, seasonId))
    .orderBy(desc(manifestoVersions.id));
}

/**
 * The season's earliest version is the pre-loaded starting text, not anyone's edit, so it is
 * excluded here rather than special-cased on day 1 or on body content.
 */
export async function hasEditedToday(
  db: Db,
  seasonId: number,
  author: MemberId,
  day: number,
): Promise<boolean> {
  const versions = await listVersions(db, seasonId);
  if (versions.length === 0) return false;
  const earliestId = Math.min(...versions.map((v) => v.id));
  return versions.some((v) => v.id !== earliestId && v.author === author && v.day === day);
}

/** Every save is a version, except a save that changed nothing. */
export async function saveVersion(
  db: Db,
  input: { seasonId: number; author: MemberId; day: number; body: string },
): Promise<ManifestoVersion | null> {
  const body = input.body.trim();
  if (body.length === 0 || body.length > MANIFESTO_MAX)
    throw new Error(`The Manifesto must be 1 to ${MANIFESTO_MAX} characters`);
  if (body === (await currentManifesto(db, input.seasonId)).trim()) return null;
  if (await hasEditedToday(db, input.seasonId, input.author, input.day))
    throw new Error("Only one Manifesto edit per person per day");
  const [v] = await db
    .insert(manifestoVersions)
    .values({ seasonId: input.seasonId, author: input.author, day: input.day, body })
    .returning();
  return v;
}
