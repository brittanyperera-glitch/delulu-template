import { describe, expect, it } from "vitest";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { addJarItem, countsBySize, JAR_SIZES, listJar } from "@/lib/repo/jar";

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  return { db, seasonId: season.id };
}

describe("the jar", () => {
  it("has the five sizes in spec order", () => {
    expect(JAR_SIZES).toEqual(["tiny", "tonight", "weekend", "planning", "feral"]);
  });

  it("takes quests from both of you and counts what is still in the jar", async () => {
    const { db, seasonId } = await setup();
    await addJarItem(db, { seasonId, author: "alex", body: "cold plunge", size: "feral" });
    await addJarItem(db, {
      seasonId,
      author: "sam",
      body: "pasta from scratch",
      size: "tonight",
    });
    await addJarItem(db, { seasonId, author: "sam", body: "sauna then snow", size: "feral" });
    expect(await listJar(db, seasonId)).toHaveLength(3);
    const counts = await countsBySize(db, seasonId);
    expect(counts.feral).toBe(2);
    expect(counts.tonight).toBe(1);
    expect(counts.tiny).toBe(0);
  });

  it("refuses an empty or over-long quest", async () => {
    const { db, seasonId } = await setup();
    await expect(
      addJarItem(db, { seasonId, author: "alex", body: "  ", size: "tiny" }),
    ).rejects.toThrow(/quest/i);
    await expect(
      addJarItem(db, { seasonId, author: "alex", body: "x".repeat(141), size: "tiny" }),
    ).rejects.toThrow(/quest/i);
  });
});
