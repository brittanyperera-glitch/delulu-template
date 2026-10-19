import { cache } from "react";
import { dayNumber, localDate } from "@/lib/days";
import { db } from "@/lib/db/client";
import { applyRollover, type Rollover } from "@/lib/rollover";
import { requireSeason } from "@/lib/season";
import { getPlayer } from "@/lib/session";

/**
 * Cost saver only. Every rollover write carries its own precondition, so running it twice is
 * harmless; this stops a warm instance repeating it on every request of the same local day.
 * Nothing can fall due mid-day: a bomb must be armed for a day after today, and a checkpoint
 * day is fixed. Set after the await, so a failed roll is retried by the next request.
 */
let rolledFor = "";

export const dayContext = cache(async () => {
  const player = await getPlayer();
  const season = await requireSeason();
  const now = new Date();
  const today = localDate(now, season.timezone);
  const day = dayNumber(now, season.dayOne, season.timezone);
  const key = `${season.id}:${today}`;
  let rollover: Rollover | null = null;
  if (rolledFor !== key) {
    rollover = await applyRollover(db(), season, now);
    rolledFor = key;
  }
  return { player, season, day, rollover };
});
