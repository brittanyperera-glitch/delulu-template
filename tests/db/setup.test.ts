import { describe, expect, it } from "vitest";
import { manifestoVersions, members, type Paper, seasons } from "@/lib/db/schema";
import { createMigratedDb, createTestDb } from "@/lib/db/test-db";
import { loadMembers, memberIds } from "@/lib/members";
import { isSetUp, SetupRefused, setUpGroup } from "@/lib/repo/seasons";

const THREE = [
  { slug: "ana", name: "Ana", colour: "mustard" },
  { slug: "ben", name: "Ben", colour: "sky" },
  { slug: "cy", name: "Cy", colour: "rose" },
] as const;
const input = (list: readonly { slug: string; name: string; colour: Paper }[] = THREE) => ({
  members: list,
  dayOne: "2026-10-01",
  timezone: "Pacific/Auckland",
});

describe.each([true, false])("setUpGroup (atomic=%s)", (atomic) => {
  it("creates three members in order, then a season on the chosen date and zone", async () => {
    const db = await createMigratedDb();
    const season = await setUpGroup(db, input(), atomic);
    expect(memberIds(await loadMembers(db))).toEqual(["ana", "ben", "cy"]);
    expect(season.dayOne).toBe("2026-10-01");
    expect(season.timezone).toBe("Pacific/Auckland");
    const [v] = await db.select().from(manifestoVersions);
    expect(v.author).toBe("ana");
  });

  it("rejects one member and nine members without writing anything", async () => {
    const db = await createMigratedDb();
    await expect(setUpGroup(db, input(THREE.slice(0, 1)), atomic)).rejects.toThrow(/2 to 8/);
    const nine = Array.from({ length: 9 }, (_, i) => ({
      slug: `m${i}`,
      name: `M${i}`,
      colour: "sky" as const,
    }));
    await expect(setUpGroup(db, { ...input(), members: nine }, atomic)).rejects.toThrow(/2 to 8/);
    expect(await db.select().from(members)).toHaveLength(0);
    expect(await db.select().from(seasons)).toHaveLength(0);
  });

  it("is refused once a season exists and leaves the group untouched", async () => {
    const db = await createTestDb();
    await expect(setUpGroup(db, input(), atomic)).rejects.toBeInstanceOf(SetupRefused);
    expect(memberIds(await loadMembers(db))).toEqual(["alex", "sam", "jo"]);
  });

  it("a failure while writing members leaves setup usable, and a retry succeeds", async () => {
    const db = await createMigratedDb();
    const bad = [{ slug: "Not A Slug", name: "Bad", colour: "sky" as const }, THREE[1]];
    await expect(setUpGroup(db, input(bad), atomic)).rejects.toThrow();
    expect(await db.select().from(members)).toHaveLength(0);
    await setUpGroup(db, input(), atomic);
    expect(await db.select().from(members)).toHaveLength(3);
  });

  it("a failure after the members are in removes them again", async () => {
    const db = await createMigratedDb();
    await expect(setUpGroup(db, { ...input(), dayOne: "not-a-date" }, atomic)).rejects.toThrow();
    expect(await db.select().from(members)).toHaveLength(0);
    expect(await db.select().from(seasons)).toHaveLength(0);
  });
});

describe("setUpGroup without transactions", () => {
  it("clears members left behind by a crashed earlier attempt", async () => {
    const db = await createMigratedDb();
    await db
      .insert(members)
      .values({ slug: "ana", displayName: "Old", colour: "sky", sortOrder: 0 });
    await setUpGroup(db, input(), false);
    expect((await loadMembers(db)).ana.name).toBe("Ana");
  });
});

describe("setUpGroup self-heal", () => {
  it("a season with no members is not set up, and setup repairs it", async () => {
    const db = await createMigratedDb();
    await db.insert(seasons).values({ number: 1, dayOne: "2026-09-01", timezone: "UTC" });
    expect(await isSetUp(db)).toBe(false);
    const season = await setUpGroup(db, input(), false);
    expect(await isSetUp(db)).toBe(true);
    expect(season.dayOne).toBe("2026-10-01");
    expect(await db.select().from(seasons)).toHaveLength(1);
  });

  it("a failure at the manifesto step leaves no season and no members (non-atomic)", async () => {
    const real = await createMigratedDb();
    const db = new Proxy(real, {
      get(target, prop, recv) {
        if (prop !== "insert") return Reflect.get(target, prop, recv);
        return (table: unknown) => {
          if (table === manifestoVersions) throw new Error("injected");
          return target.insert(table as typeof seasons);
        };
      },
    });
    await expect(setUpGroup(db, input(), false)).rejects.toThrow("injected");
    expect(await real.select().from(seasons)).toHaveLength(0);
    expect(await real.select().from(members)).toHaveLength(0);
    expect(await isSetUp(real)).toBe(false);
  });

  it("a second setup after a full one is still refused", async () => {
    const db = await createMigratedDb();
    await setUpGroup(db, input(), false);
    expect(await isSetUp(db)).toBe(true);
    await expect(setUpGroup(db, input(), false)).rejects.toBeInstanceOf(SetupRefused);
    expect(await db.select().from(members)).toHaveLength(3);
  });
});
