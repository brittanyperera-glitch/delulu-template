import type { Db } from "@/lib/db/client";
import type { Paper } from "@/lib/db/schema";

/**
 * Members live in the database, but names are read synchronously in client components, so
 * the server loads them once (`loadMembers`) and hands the map down: through
 * `MembersProvider` to client components, as a prop to server components. Everything below
 * `loadMembers` is pure and safe to import from either side; this file has type-only imports
 * so it never pulls a database driver into a client bundle.
 */

export type MemberId = string;
export type Member = { slug: MemberId; name: string; colour: Paper; sortOrder: number };
/** Keyed by slug. Insertion order is sort order, so Object.values() is already ordered. */
export type MembersMap = Readonly<Record<MemberId, Member>>;

export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 8;

export async function loadMembers(db: Db): Promise<MembersMap> {
  const rows = await db.query.members.findMany({ orderBy: (m, { asc }) => [asc(m.sortOrder)] });
  return toMembersMap(
    rows.map((r) => ({
      slug: r.slug,
      name: r.displayName,
      colour: r.colour,
      sortOrder: r.sortOrder,
    })),
  );
}

export async function memberExists(db: Db, slug: string): Promise<boolean> {
  const row = await db.query.members.findFirst({
    where: (m, { eq }) => eq(m.slug, slug),
    columns: { slug: true },
  });
  return row !== undefined;
}

export function toMembersMap(list: readonly Member[]): MembersMap {
  const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  return Object.fromEntries(sorted.map((m) => [m.slug, m]));
}

export function memberList(map: MembersMap): Member[] {
  return Object.values(map).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function memberIds(map: MembersMap): MemberId[] {
  return memberList(map).map((m) => m.slug);
}

export function isMember(map: MembersMap, x: unknown): x is MemberId {
  return typeof x === "string" && Object.hasOwn(map, x);
}

/** Falls back to the slug: a member deleted after posting still renders as something. */
export function nameOf(map: MembersMap, id: MemberId): string {
  return map[id]?.name ?? id;
}

/** Everyone except `id`, in sort order. */
export function othersOf(map: MembersMap, id: MemberId): Member[] {
  return memberList(map).filter((m) => m.slug !== id);
}

export function colourOf(map: MembersMap, id: MemberId): Paper {
  return map[id]?.colour ?? "cream";
}

export function initialOf(map: MembersMap, id: MemberId): string {
  return nameOf(map, id).charAt(0).toUpperCase();
}

/** "Alex", "Alex and Sam", "Alex, Sam and Jo". */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
