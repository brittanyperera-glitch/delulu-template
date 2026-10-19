import { TRUTH_OR_TRUTH } from "@/lib/content/truth-or-truth";
import { CHECKPOINTS, dayNumber, TOTAL_DAYS } from "@/lib/days";
import type { Db } from "@/lib/db/client";
import { checkpoints } from "@/lib/db/schema";

export type Rollover = {
  day: number;
  /** Checkpoint days this call flagged. */
  flagged: number[];
  question: string | null;
};

export async function applyRollover(
  db: Db,
  season: { id: number; dayOne: string; timezone: string },
  now: Date = new Date(),
): Promise<Rollover> {
  const day = dayNumber(now, season.dayOne, season.timezone);
  const out: Rollover = { day, flagged: [], question: null };
  if (day < 1) return out;
  out.question = day <= TOTAL_DAYS ? TRUTH_OR_TRUTH[day - 1] : null;

  // Every checkpoint day up to today, not only today, so a day nobody opened still gets its row.
  const dueDays = CHECKPOINTS.filter((d) => d <= day);
  if (dueDays.length > 0) {
    const flagged = await db
      .insert(checkpoints)
      .values(dueDays.map((d) => ({ seasonId: season.id, day: d })))
      .onConflictDoNothing()
      .returning({ day: checkpoints.day });
    out.flagged = flagged.map((r) => r.day);
  }
  return out;
}
