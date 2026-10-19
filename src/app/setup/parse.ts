import { PAPERS, type Paper } from "@/lib/db/schema";
import { MAX_MEMBERS, MIN_MEMBERS } from "@/lib/members";
import { DAYS_AHEAD, DAYS_BACK, dayOneRange, shiftDate } from "./range";

export type SetupInput = {
  members: { name: string; colour: Paper }[];
  dayOne: string;
  timezone: string;
};

export const MAX_NAME_LENGTH = 24;
/** Colours handed out in order until the user picks one, so a fresh form is never all one paper. */
export const DEFAULT_COLOURS: readonly Paper[] = PAPERS.slice(1, 1 + MAX_MEMBERS);

function isRealDate(ymd: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) && shiftDate(ymd, 0) === ymd;
}

/** Canonical IANA name, or null. Intl is the authority; supportedValuesOf omits "UTC". */
export function canonicalZone(tz: string): string | null {
  try {
    return new Intl.DateTimeFormat("en", { timeZone: tz }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

/** Slugs satisfy the members_slug_format CHECK; clashes get -2, -3. Order matches `names`. */
export function slugsFor(names: readonly string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const base =
      name
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 28) || "member";
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return slug;
  });
}

export type ParseResult = { ok: true; value: SetupInput } | { ok: false; error: string };

/** Reads the setup form. Rows are `name` and `colour` pairs in DOM order; blank names are skipped. */
export function parseSetup(form: FormData, now: Date): ParseResult {
  const names = form.getAll("name").map((v) => String(v).trim());
  const colours = form.getAll("colour").map(String);
  const members: SetupInput["members"] = [];
  for (let i = 0; i < names.length; i++) {
    if (!names[i]) continue;
    if (names[i].length > MAX_NAME_LENGTH) return { ok: false, error: "That name is too long." };
    const colour = colours[i] as Paper;
    if (!PAPERS.includes(colour)) return { ok: false, error: "Pick a colour for each person." };
    members.push({ name: names[i], colour });
  }
  if (members.length < MIN_MEMBERS)
    return { ok: false, error: `Add at least ${MIN_MEMBERS} people.` };
  if (members.length > MAX_MEMBERS) return { ok: false, error: `At most ${MAX_MEMBERS} people.` };

  const timezone = canonicalZone(String(form.get("timezone") ?? ""));
  if (!timezone) return { ok: false, error: "Pick a timezone from the list." };

  const dayOne = String(form.get("dayOne") ?? "");
  if (!isRealDate(dayOne)) return { ok: false, error: "Pick a start date." };
  const { min, max } = dayOneRange(now, timezone);
  if (dayOne < min || dayOne > max)
    return {
      ok: false,
      error: `Start between ${DAYS_BACK} days ago and ${DAYS_AHEAD} days from now.`,
    };

  return { ok: true, value: { members, dayOne, timezone } };
}
