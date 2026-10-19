import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DRAWER_GROUPS, ROOMS, roomsIn, themeFor } from "@/lib/rooms";

describe("rooms registry", () => {
  it("has a unique slug per room", () => {
    const slugs = ROOMS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // The drawer links straight to /<slug>. A typo here ships a 404 that no other test would
  // notice, so the registry is checked against the routes that actually exist on disk.
  it("points every room at a route that exists", () => {
    for (const room of ROOMS) {
      expect(existsSync(`src/app/${room.slug}/page.tsx`), room.slug).toBe(true);
    }
  });

  it("keeps every label to three words or fewer", () => {
    for (const room of ROOMS) {
      expect(room.label.split(/\s+/).filter(Boolean).length, room.slug).toBeLessThanOrEqual(3);
    }
  });

  // Design change (2026-09-08): "there is no delusions tab and there should be".
  // The creed rooms lead the wall but must ALSO be in the drawer, because the drawer is the
  // one place every room is reachable; hiding them left Delusions with no tab at all.
  it("lists the creed rooms in the drawer", () => {
    const inDrawer = DRAWER_GROUPS.flatMap((g) => roomsIn(g.group)).map((r) => r.slug);
    expect(inDrawer).toContain("manifesto");
    expect(inDrawer).toContain("delusions");
    expect(inDrawer).toContain("spoilers");
  });

  it("puts every room in exactly one drawer group", () => {
    const inDrawer = DRAWER_GROUPS.flatMap((g) => roomsIn(g.group)).map((r) => r.slug);
    const expected = ROOMS.map((r) => r.slug);
    expect([...inDrawer].sort()).toEqual([...expected].sort());
    expect(new Set(inDrawer).size).toBe(inDrawer.length);
  });

  it("gives an unknown slug the base paper rather than nothing", () => {
    expect(themeFor("not-a-room").page).toBe("bg-cream");
  });
});
