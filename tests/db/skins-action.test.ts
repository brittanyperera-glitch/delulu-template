import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db/client";

let testDb: Db;
let seasonId: number;
let asPlayer: "alex" | "sam" = "alex";

vi.mock("@/lib/db/client", () => ({ db: () => testDb }));
vi.mock("@/lib/session", () => ({ getPlayer: async () => asPlayer }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateSkinAction } from "@/actions/skins";
import { skins } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import { createSkin } from "@/lib/repo/skins";

beforeAll(async () => {
  testDb = await createTestDb();
  const season = await currentSeason(testDb);
  seasonId = season.id;
});

describe("updateSkinAction", () => {
  it("lets the owner update their own skin, in place", async () => {
    asPlayer = "alex";
    const skin = await createSkin(testDb, { seasonId, owner: "alex", name: "CEO Alex" });
    const updated = await updateSkinAction(skin.id, { name: "Founder Alex", paper: "sky" });
    expect(updated.name).toBe("Founder Alex");
    const [row] = await testDb.select().from(skins).where(eq(skins.id, skin.id));
    expect(row.name).toBe("Founder Alex");
    expect(row.paper).toBe("sky");
  });

  it("refuses to update a skin someone else owns", async () => {
    asPlayer = "sam";
    const skin = await createSkin(testDb, { seasonId, owner: "alex", name: "CEO Alex 2" });
    await expect(updateSkinAction(skin.id, { name: "Hijacked" })).rejects.toThrow(/author/);
    const [row] = await testDb.select().from(skins).where(eq(skins.id, skin.id));
    expect(row.name).toBe("CEO Alex 2");
  });
});
