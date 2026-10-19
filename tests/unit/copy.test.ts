import { describe, expect, it } from "vitest";
import { STRINGS } from "@/lib/content/strings";

type Leaf = { path: string; value: string };

function leaves(node: unknown, path = ""): Leaf[] {
  if (typeof node === "string") return [{ path, value: node }];
  if (typeof node === "function") {
    // waitingOn takes a list of names; every other builder takes numbers or one string.
    const call = node as (...a: unknown[]) => string;
    const value = path === "wall.waitingOn" ? call(["Alex", "Sam"]) : call(7, 100);
    return [{ path, value: String(value) }];
  }
  if (Array.isArray(node)) return node.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (node && typeof node === "object")
    return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

// These paths are labels on controls and must stay one to three words. Anchored at both
// ends: matching by prefix alone treated body copy like filters.bySkinBlurb as a label.
const SHORT =
  /^(nav\.\w+|filters\.titles\.\w+|stamps\.\w+|rooms\.\w+|papers\.\w+|patterns\.\w+|paperPicker\.\w+|bombs\.(trigger|onDay)|wall\.(rooms|yourMove|allClear|wall|yourSkins)|help\.label|wall\.kinds\.\w+|filters\.all|filters\.bySkin|composer\.kinds\.\w+|composer\.post|composer\.use|skins\.add|skins\.first|skins\.newSkin|skins\.notYou|post\.\w+|home\.add|home\.more|comments\.send|trackComments\.(send|reply)|manifesto\.(hide|show)|\w+\.(title|cta))$/;

describe("copy ceiling", () => {
  const all = leaves(STRINGS);
  it("has no string over 40 words", () => {
    for (const { path, value } of all)
      expect(value.split(/\s+/).filter(Boolean).length, path).toBeLessThanOrEqual(40);
  });
  it("labels are one to three words", () => {
    for (const { path, value } of all.filter((l) => SHORT.test(l.path)))
      expect(value.split(/\s+/).filter(Boolean).length, path).toBeLessThanOrEqual(3);
  });
  it("has no em or en dashes", () => {
    for (const { path, value } of all) expect(value, path).not.toMatch(/[—–]/);
  });
  it("has exactly the six reactions", () => {
    expect(STRINGS.reactions).toEqual([
      "wicked",
      "sure thing brother",
      "ur delulu",
      "if not now when",
      "big time",
      "ur the goat",
    ]);
  });
});
