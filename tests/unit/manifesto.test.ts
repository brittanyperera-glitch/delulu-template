import { describe, expect, it } from "vitest";
import { pickSentence, sentences } from "@/lib/manifesto";

describe("manifesto sentences", () => {
  it("splits on sentence ends and keeps the punctuation", () => {
    expect(sentences("I am so back. Delulu season commences! Why not?")).toEqual([
      "I am so back.",
      "Delulu season commences!",
      "Why not?",
    ]);
  });
  it("picks by the random number and never returns empty", () => {
    expect(pickSentence("One. Two. Three.", 0.99)).toBe("Three.");
    expect(pickSentence("One. Two. Three.", 0)).toBe("One.");
    expect(pickSentence("   ", 0.5)).toBe("Delulu season.");
  });
});
