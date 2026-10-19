import { describe, expect, it } from "vitest";
import {
  CHECKPOINTS,
  dateOfDay,
  dayNumber,
  daysLeft,
  isCheckpoint,
  localDate,
  propheciesSealed,
} from "@/lib/days";

/** The date the design spec names for Day 1. Passed explicitly now there is no default. */
const SPEC = "2026-09-02";
const BERLIN = "Europe/Berlin";

describe("localDate in Berlin", () => {
  it("uses the Berlin calendar date, not UTC", () => {
    // 23:30 UTC on 2 Sep is already 01:30 on 3 Sep in Berlin (CEST, UTC+2)
    expect(localDate(new Date("2026-09-02T23:30:00Z"), BERLIN)).toBe("2026-09-03");
    expect(localDate(new Date("2026-09-02T21:59:00Z"), BERLIN)).toBe("2026-09-02");
  });
  it("survives the end of daylight saving on 25 October", () => {
    // 23:30 UTC on 25 Oct is 00:30 on 26 Oct in Berlin (CET, UTC+1)
    expect(localDate(new Date("2026-10-25T23:30:00Z"), BERLIN)).toBe("2026-10-26");
    expect(localDate(new Date("2026-10-25T22:59:00Z"), BERLIN)).toBe("2026-10-25");
  });
});

describe("dayNumber", () => {
  it("Day 1 is 2 September 2026 all day in Berlin", () => {
    expect(dayNumber(new Date("2026-09-01T22:00:00Z"), SPEC, BERLIN)).toBe(1); // 00:00 Berlin
    expect(dayNumber(new Date("2026-09-02T21:59:59Z"), SPEC, BERLIN)).toBe(1); // 23:59 Berlin
  });
  it("Day 100 is 10 December 2026", () => {
    expect(dayNumber(new Date("2026-12-10T12:00:00Z"), SPEC, BERLIN)).toBe(100);
    expect(dateOfDay(100, SPEC)).toBe("2026-12-10");
  });
  it("counts calendar days across the DST change, not 24 hour blocks", () => {
    expect(dayNumber(new Date("2026-10-25T12:00:00Z"), SPEC, BERLIN)).toBe(54);
    expect(dayNumber(new Date("2026-10-26T12:00:00Z"), SPEC, BERLIN)).toBe(55);
  });
  it("is 0 the day before Day 1 and 101 the day after Day 100", () => {
    expect(dayNumber(new Date("2026-09-01T12:00:00Z"), SPEC, BERLIN)).toBe(0);
    expect(dayNumber(new Date("2026-12-11T12:00:00Z"), SPEC, BERLIN)).toBe(101);
  });
  it("accepts another day one for Season Two", () => {
    expect(dayNumber(new Date("2026-12-11T12:00:00Z"), "2026-12-11", BERLIN)).toBe(1);
  });
  it("reads the date in the season's own zone", () => {
    // 13:00 UTC on 10 Sep: 01:00 on 11 Sep in Auckland (UTC+12), 06:00 on 10 Sep in Los Angeles
    const now = new Date("2026-09-10T13:00:00Z");
    expect(dayNumber(now, "2026-09-01", "Pacific/Auckland")).toBe(11);
    expect(dayNumber(now, "2026-09-01", "America/Los_Angeles")).toBe(10);
  });
});

describe("the calendar", () => {
  it("checkpoints fall on the spec dates", () => {
    expect(CHECKPOINTS).toEqual([10, 25, 50, 75, 100]);
    expect(CHECKPOINTS.map((d) => dateOfDay(d, SPEC))).toEqual([
      "2026-09-11",
      "2026-09-26",
      "2026-10-21",
      "2026-11-15",
      "2026-12-10",
    ]);
    expect(isCheckpoint(50)).toBe(true);
    expect(isCheckpoint(51)).toBe(false);
  });
  it("prophecies seal from Day 8", () => {
    expect(propheciesSealed(7)).toBe(false);
    expect(propheciesSealed(8)).toBe(true);
  });
  it("days left counts down to zero on Day 100", () => {
    expect(daysLeft(7)).toBe(93);
    expect(daysLeft(100)).toBe(0);
  });
});
