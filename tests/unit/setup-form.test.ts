import { describe, expect, it } from "vitest";
import { parseSetup, slugsFor } from "@/app/setup/parse";
import { dayOneRange } from "@/app/setup/range";
import { localDate } from "@/lib/days";

// 2026-10-17 12:00 UTC is already the 18th in Auckland and still the 17th in Los Angeles.
const NOW = new Date("2026-10-17T12:00:00Z");

function form(entries: [string, string][]): FormData {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}
function valid(over: Partial<Record<string, string>> = {}, names = ["Ana", "Ben", "Cy"]) {
  return form([
    ...names.flatMap((n): [string, string][] => [
      ["name", n],
      ["colour", "mustard"],
    ]),
    ["timezone", over.timezone ?? "Europe/Berlin"],
    ["dayOne", over.dayOne ?? "2026-10-17"],
  ]);
}

describe("parseSetup", () => {
  it("accepts three people, a zone and today", () => {
    const r = parseSetup(valid(), NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.members.map((m) => m.name)).toEqual(["Ana", "Ben", "Cy"]);
      expect(r.value.timezone).toBe("Europe/Berlin");
    }
  });
  it("skips blank rows and counts only named people", () => {
    expect(parseSetup(valid({}, ["Ana", "", "Ben"]), NOW).ok).toBe(true);
  });
  it("rejects one member", () => {
    const r = parseSetup(valid({}, ["Ana"]), NOW);
    expect(r).toEqual({ ok: false, error: "Add at least 2 people." });
  });
  it("rejects nine members", () => {
    const r = parseSetup(
      valid(
        {},
        Array.from({ length: 9 }, (_, i) => `P${i}`),
      ),
      NOW,
    );
    expect(r).toEqual({ ok: false, error: "At most 8 people." });
  });
  it("accepts eight", () => {
    expect(
      parseSetup(
        valid(
          {},
          Array.from({ length: 8 }, (_, i) => `P${i}`),
        ),
        NOW,
      ).ok,
    ).toBe(true);
  });
  it("rejects an invalid timezone and an unknown colour", () => {
    expect(parseSetup(valid({ timezone: "Mars/Olympus" }), NOW).ok).toBe(false);
    expect(parseSetup(valid({ timezone: "" }), NOW).ok).toBe(false);
    const f = valid();
    f.set("colour", "chartreuse");
    expect(parseSetup(f, NOW).ok).toBe(false);
  });
  it("accepts UTC, which Intl.supportedValuesOf leaves out", () => {
    expect(parseSetup(valid({ timezone: "UTC" }), NOW).ok).toBe(true);
  });
  it("bounds the start date: 30 days back to 7 ahead, in the chosen zone", () => {
    expect(parseSetup(valid({ dayOne: "2026-09-17" }), NOW).ok).toBe(true);
    expect(parseSetup(valid({ dayOne: "2026-09-16" }), NOW).ok).toBe(false);
    expect(parseSetup(valid({ dayOne: "2026-10-24" }), NOW).ok).toBe(true);
    expect(parseSetup(valid({ dayOne: "2026-10-25" }), NOW).ok).toBe(false);
    // The same instant is a day later in Auckland, so its window moves with it.
    const nz = { timezone: "Pacific/Auckland" };
    expect(parseSetup(valid({ ...nz, dayOne: "2026-10-25" }), NOW).ok).toBe(true);
    expect(dayOneRange(NOW, "Pacific/Auckland").max).toBe("2026-10-25");
    expect(localDate(NOW, "America/Los_Angeles")).toBe("2026-10-17");
  });
  it("rejects a malformed or impossible date", () => {
    expect(parseSetup(valid({ dayOne: "17/10/2026" }), NOW).ok).toBe(false);
    expect(parseSetup(valid({ dayOne: "2026-02-30" }), NOW).ok).toBe(false);
    expect(parseSetup(valid({ dayOne: "" }), NOW).ok).toBe(false);
  });
});

describe("slugsFor", () => {
  const OK = /^[a-z0-9-]{1,32}$/;
  it("lowercases and deduplicates with -2, -3", () => {
    expect(slugsFor(["Sam", "sam", "SAM", "Jo"])).toEqual(["sam", "sam-2", "sam-3", "jo"]);
  });
  it("keeps every slug inside the database check, whatever the name", () => {
    const slugs = slugsFor([
      "Zoë O'Brien",
      "!!!",
      "日本",
      "a".repeat(60),
      "a".repeat(60),
      "Sam 2",
      "Sam",
      "Sam",
    ]);
    for (const s of slugs) expect(s).toMatch(OK);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs[0]).toBe("zoe-o-brien");
  });
});
