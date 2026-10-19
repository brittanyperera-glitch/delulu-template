import { SITE } from "@/config/site";

export const TOTAL_DAYS = SITE.totalDays;
export const CHECKPOINTS = SITE.checkpoints;

const dateFmts = new Map<string, Intl.DateTimeFormat>();

function formatter(
  cache: Map<string, Intl.DateTimeFormat>,
  tz: string,
  locale: string,
  o: Intl.DateTimeFormatOptions,
) {
  const hit = cache.get(tz);
  if (hit) return hit;
  const f = new Intl.DateTimeFormat(locale, { timeZone: tz, ...o });
  cache.set(tz, f);
  return f;
}

/** Calendar date in an IANA timezone as YYYY-MM-DD. Throws RangeError on an unknown zone. */
export function localDate(now: Date, tz: string): string {
  return formatter(dateFmts, tz, "en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function utcMidnight(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 1-based day number; calendar difference so DST cannot shift a day. */
export function dayNumber(now: Date, dayOne: string, tz: string): number {
  const diff = utcMidnight(localDate(now, tz)) - utcMidnight(dayOne);
  return Math.round(diff / 86_400_000) + 1;
}

export function daysLeft(day: number): number {
  return TOTAL_DAYS - day;
}

export function dateOfDay(day: number, dayOne: string): string {
  const t = utcMidnight(dayOne) + (day - 1) * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function isCheckpoint(day: number): boolean {
  return (CHECKPOINTS as readonly number[]).includes(day);
}

export function propheciesSealed(day: number): boolean {
  return day >= SITE.sealDay;
}
