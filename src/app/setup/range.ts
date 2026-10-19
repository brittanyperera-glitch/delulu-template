import { localDate } from "@/lib/days";

export const DAYS_BACK = 30;
export const DAYS_AHEAD = 7;

export function shiftDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Allowed day-one dates in the given zone, as inclusive YYYY-MM-DD bounds. */
export function dayOneRange(now: Date, tz: string): { min: string; max: string } {
  const today = localDate(now, tz);
  return { min: shiftDate(today, -DAYS_BACK), max: shiftDate(today, DAYS_AHEAD) };
}
