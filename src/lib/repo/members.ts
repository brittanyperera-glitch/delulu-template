import { inArray } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import type { Paper } from "@/lib/db/schema";
import { members } from "@/lib/db/schema";
import { MAX_MEMBERS, MIN_MEMBERS } from "@/lib/members";

export type NewMember = { slug: string; name: string; colour: Paper };

/** Inserts in the order given; that order becomes sort order. */
export async function insertMembers(db: Db, list: readonly NewMember[]): Promise<void> {
  if (list.length < MIN_MEMBERS || list.length > MAX_MEMBERS)
    throw new Error(`A group has ${MIN_MEMBERS} to ${MAX_MEMBERS} members`);
  await db
    .insert(members)
    .values(
      list.map((m, i) => ({ slug: m.slug, displayName: m.name, colour: m.colour, sortOrder: i })),
    );
}

export async function removeMembers(db: Db, slugs: readonly string[]): Promise<void> {
  await db.delete(members).where(inArray(members.slug, [...slugs]));
}
