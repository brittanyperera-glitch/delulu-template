import { describe, expect, it } from "vitest";
import { COMPOSER_PROMPTS } from "@/lib/content/composer-prompts";
import { STRINGS } from "@/lib/content/strings";
import { TRUTH_OR_TRUTH } from "@/lib/content/truth-or-truth";
import { MANIFESTO_V1 } from "@/lib/manifesto";

// Words that only make sense for the one person the app was first written for.
const PERSON_SPECIFIC =
  /marathon|\bCEO\b|skydiv|musician|athlete|\bflat\b|\bmeeting\b|\bat work\b|7am|\bcompany\b|million|top 100|\bthe job\b/i;

function banks(): [string, readonly string[]][] {
  return [
    ["truth", TRUTH_OR_TRUTH],
    ["composer", COMPOSER_PROMPTS],
    ["manifesto", MANIFESTO_V1.split("\n")],
    ["skins.firstBlurb", [STRINGS.skins.firstBlurb]],
    ["reactions", STRINGS.reactions],
  ];
}

describe("content is neutral", () => {
  it("keeps every bank at its original size", () => {
    expect(TRUTH_OR_TRUTH).toHaveLength(100);
    expect(COMPOSER_PROMPTS).toHaveLength(30);
    expect(MANIFESTO_V1.split("\n")).toHaveLength(6);
    expect(STRINGS.reactions).toHaveLength(6);
  });

  it("names no person and presumes no job, hobby or home", () => {
    for (const [bank, xs] of banks())
      for (const x of xs) expect(x, `${bank}: ${x}`).not.toMatch(PERSON_SPECIFIC);
  });

  it("obeys the copy bar: no dashes, no curly quotes, under 40 words", () => {
    for (const [bank, xs] of banks())
      for (const x of xs) {
        expect(x, `${bank}: ${x}`).not.toMatch(/[—–‘’“”]/);
        expect(x.split(/\s+/).length, `${bank}: ${x}`).toBeLessThan(40);
      }
  });

  it("keeps the other-person placeholder in exactly one composer prompt", () => {
    expect(COMPOSER_PROMPTS.filter((p) => p.includes("the other one"))).toHaveLength(1);
  });

  it("keeps the manifesto opener and the day-one closer", () => {
    const lines = MANIFESTO_V1.split("\n");
    expect(lines[0]).toMatch(/100 days/i);
    expect(lines[5]).toMatch(/begins|starts/i);
  });

  it("has the two new member-picker labels", () => {
    expect(STRINGS.pickers.betAgainst).toBe("Bet against");
    expect(STRINGS.pickers.dareWho).toBe("Dare who");
  });
});
