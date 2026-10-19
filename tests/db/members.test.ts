import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sign } from "@/lib/auth";
import { bets, members, posts, skins } from "@/lib/db/schema";
import { createTestDb, currentSeason, TEST_MEMBERS } from "@/lib/db/test-db";
import { loadMembers, memberExists, nameOf, othersOf } from "@/lib/members";
import { memberFromToken } from "@/lib/session";

describe("members", () => {
  it("the test database starts with three members, in sort order", async () => {
    const db = await createTestDb();
    const map = await loadMembers(db);
    expect(Object.keys(map)).toEqual(["alex", "sam", "jo"]);
    expect(nameOf(map, "jo")).toBe("Jo");
    expect(othersOf(map, "sam").map((m) => m.slug)).toEqual(["alex", "jo"]);
    expect(await memberExists(db, "sam")).toBe(true);
    expect(await memberExists(db, "zed")).toBe(false);
  });

  it("every member can post", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    for (const m of TEST_MEMBERS) {
      const [skin] = await db
        .insert(skins)
        .values({ seasonId: season.id, owner: m.slug, name: `CEO ${m.displayName}` })
        .returning();
      await db.insert(posts).values({
        seasonId: season.id,
        author: m.slug,
        day: 1,
        skinId: skin.id,
        type: "text",
        body: "so back",
      });
    }
    const rows = await db.select({ author: posts.author }).from(posts);
    expect(rows.map((r) => r.author).sort()).toEqual(["alex", "jo", "sam"]);
  });

  it("refuses a post by a slug that is not a member", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const [skin] = await db
      .insert(skins)
      .values({ seasonId: season.id, owner: "alex", name: "CEO Alex" })
      .returning();
    const err = await db
      .insert(posts)
      .values({
        seasonId: season.id,
        author: "zed",
        day: 1,
        skinId: skin.id,
        type: "text",
        body: "who",
      })
      .then(
        () => null,
        (e: Error) => e,
      );
    // Drizzle wraps the driver error; the cause names the constraint that refused it.
    expect(String((err as { cause?: unknown } | null)?.cause)).toMatch(
      /posts_author_members_slug_fk/,
    );
  });

  it("refuses a slug that is not cookie-safe", async () => {
    const db = await createTestDb();
    await expect(
      db
        .insert(members)
        .values({ slug: "Bob Smith", displayName: "Bob", colour: "teal", sortOrder: 9 }),
    ).rejects.toThrow();
  });

  it("a bet needs two different people", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const bet = { seasonId: season.id, proposer: "alex", claim: "c", stakes: "s" };
    await expect(db.insert(bets).values({ ...bet, opponent: "alex" })).rejects.toThrow();
    await expect(db.insert(bets).values({ ...bet, opponent: "jo" })).resolves.toBeDefined();
  });

  it("a signed cookie only counts while its slug is a member", async () => {
    const db = await createTestDb();
    const map = await loadMembers(db);
    expect(await memberFromToken(await sign("sam", "k"), "k", map)).toBe("sam");
    expect(await memberFromToken(await sign("zed", "k"), "k", map)).toBeNull();
    expect(await memberFromToken(await sign("sam", "k"), "other-key", map)).toBeNull();
  });

  it("ships exactly one baseline migration", () => {
    expect(readdirSync("drizzle").filter((f) => f.endsWith(".sql"))).toHaveLength(1);
  });
});
