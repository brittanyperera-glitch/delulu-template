import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { createSkin, listSkins, skinById, updateSkin } from "@/lib/repo/skins";

describe("skins", () => {
  it("creates and lists skins per season", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
    await createSkin(db, {
      seasonId: season.id,
      owner: "sam",
      name: "Michelin Sam",
      line: "three stars, no notes",
    });
    const all = await listSkins(db, season.id);
    expect(all.map((s) => s.name)).toEqual(["CEO Alex", "Michelin Sam"]);
  });

  it("refuses an empty or over-long name", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    await expect(
      createSkin(db, { seasonId: season.id, owner: "alex", name: "  " }),
    ).rejects.toThrow(/name/);
    await expect(
      createSkin(db, { seasonId: season.id, owner: "alex", name: "x".repeat(41) }),
    ).rejects.toThrow(/name/);
  });
});

describe("updateSkin", () => {
  it("lets the owner edit name, line, paper and pattern in place", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
    const updated = await updateSkin(db, skin.id, "alex", {
      name: "Founder Alex",
      line: "hired herself",
      paper: "sky",
      pattern: "grid",
    });
    expect(updated.name).toBe("Founder Alex");
    expect(updated.line).toBe("hired herself");
    expect(updated.paper).toBe("sky");
    expect(updated.pattern).toBe("grid");
    // In place, not a new row: the same id now reads the edit everywhere it is joined.
    const reloaded = await skinById(db, skin.id);
    expect(reloaded?.name).toBe("Founder Alex");
  });

  it("refuses anyone but the owner", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
    await expect(updateSkin(db, skin.id, "sam", { name: "Hijacked" })).rejects.toThrow(/author/);
    const reloaded = await skinById(db, skin.id);
    expect(reloaded?.name).toBe("CEO Alex");
  });

  it("refuses an empty or over-long name, same as create", async () => {
    const db = await createTestDb();
    const season = await currentSeason(db);
    const skin = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
    await expect(updateSkin(db, skin.id, "alex", { name: "  " })).rejects.toThrow(/name/);
    await expect(updateSkin(db, skin.id, "alex", { name: "x".repeat(41) })).rejects.toThrow(/name/);
  });
});
