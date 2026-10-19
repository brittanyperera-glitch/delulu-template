import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMPOSER_PROMPTS, promptFor } from "@/lib/content/composer-prompts";
import { parsePrompts, parseTruth } from "@/lib/content/generate";
import { TRUTH_OR_TRUTH } from "@/lib/content/truth-or-truth";

describe("content banks", () => {
  it("has one Truth or Truth question per day", () => {
    expect(TRUTH_OR_TRUTH).toHaveLength(100);
    expect(new Set(TRUTH_OR_TRUTH).size).toBe(100);
    for (const q of TRUTH_OR_TRUTH) {
      expect(q.trim().length).toBeGreaterThan(5);
      expect(q).not.toMatch(/[—–]/);
    }
    expect(TRUTH_OR_TRUTH[0]).toBe("villain origin story. go.");
    expect(TRUTH_OR_TRUTH[99]).toBe("season two. yes or yes");
  });
  it("has thirty composer prompts and names the other person", () => {
    expect(COMPOSER_PROMPTS).toHaveLength(30);
    expect(promptFor(["Alex"], 4)).toContain("Alex");
    expect(promptFor(["Sam"], 4)).toContain("Sam");
  });
  it("the committed banks match the docs (run pnpm content if this fails)", () => {
    // Compare parsed content, not bytes: Biome may reformat the generated files.
    expect(TRUTH_OR_TRUTH).toEqual(
      parseTruth(readFileSync("docs/content/truth-or-truth.md", "utf8")),
    );
    expect(COMPOSER_PROMPTS).toEqual(
      parsePrompts(readFileSync("docs/content/composer-prompts.md", "utf8")),
    );
  });
});
