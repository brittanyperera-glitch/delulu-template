import { and, desc, eq } from "drizzle-orm";
import { TRUTH_OR_TRUTH } from "@/lib/content/truth-or-truth";
import { TOTAL_DAYS } from "@/lib/days";
import type { Db } from "@/lib/db/client";
import { type TruthAnswer, truthAnswers } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";

export const ANSWER_MAX = 500;

export function questionFor(day: number): string | null {
  if (day < 1 || day > TOTAL_DAYS) return null;
  return TRUTH_OR_TRUTH[day - 1];
}

export async function answersFor(db: Db, seasonId: number, day: number): Promise<TruthAnswer[]> {
  return db
    .select()
    .from(truthAnswers)
    .where(and(eq(truthAnswers.seasonId, seasonId), eq(truthAnswers.day, day)))
    .orderBy(truthAnswers.id);
}

/** Everyone has answered, or the day is over: a member who never answers cannot hold it back. */
export function revealed(
  answers: TruthAnswer[],
  memberIds: readonly MemberId[],
  day: number,
  today: number,
): boolean {
  return day < today || memberIds.every((m) => answers.some((a) => a.author === m));
}

export async function answer(
  db: Db,
  input: { seasonId: number; day: number; author: MemberId; body: string },
  memberIds: readonly MemberId[],
  today: number,
): Promise<TruthAnswer> {
  const body = input.body.trim();
  if (body.length === 0 || body.length > ANSWER_MAX)
    throw new Error(`An answer must be 1 to ${ANSWER_MAX} characters`);
  if (!questionFor(input.day)) throw new Error("No question on that day");
  const existing = await answersFor(db, input.seasonId, input.day);
  // Changeable until revealed, so nobody edits having read the others.
  if (revealed(existing, memberIds, input.day, today)) throw new Error("Answers are already in");
  const [row] = await db
    .insert(truthAnswers)
    .values({ ...input, body })
    .onConflictDoUpdate({
      target: [truthAnswers.seasonId, truthAnswers.day, truthAnswers.author],
      set: { body },
    })
    .returning();
  return row;
}

/** Days that are revealed (all answered, or over), newest first: the archive. */
export async function answeredDays(
  db: Db,
  seasonId: number,
  memberIds: readonly MemberId[],
  today: number,
): Promise<number[]> {
  const rows = await db
    .select({ day: truthAnswers.day, author: truthAnswers.author })
    .from(truthAnswers)
    .where(eq(truthAnswers.seasonId, seasonId))
    .orderBy(desc(truthAnswers.day));
  const seen = new Map<number, Set<string>>();
  for (const r of rows) {
    const set = seen.get(r.day) ?? new Set<string>();
    set.add(r.author);
    seen.set(r.day, set);
  }
  return [...seen.entries()]
    .filter(([day, set]) => day < today || memberIds.every((m) => set.has(m)))
    .map(([day]) => day);
}
