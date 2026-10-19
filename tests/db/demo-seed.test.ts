import { PgTable } from "drizzle-orm/pg-core";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

let testDb: Db;
vi.mock("@/lib/db/client", () => ({ db: () => testDb }));

import { GET, POST } from "@/app/api/demo-reset/route";
import { createMigratedDb } from "@/lib/db/test-db";
import { loadMembers } from "@/lib/members";
import { seedDemo, tableCounts } from "@/lib/repo/demo-seed";
import { listWall } from "@/lib/repo/posts";
import { currentSeason } from "@/lib/repo/seasons";

const NOW = new Date("2026-10-17T12:00:00Z");
const call = (auth?: string) =>
  POST(
    new Request("http://x/api/demo-reset", {
      method: "POST",
      headers: auth ? { authorization: auth } : {},
    }),
  );

beforeAll(async () => {
  testDb = await createMigratedDb();
});
afterEach(() => vi.unstubAllEnvs());

describe("seedDemo", () => {
  it("seeds a started season at day 23 with three members and no media", async () => {
    await seedDemo(testDb, NOW);
    const members = await loadMembers(testDb);
    expect(Object.keys(members)).toHaveLength(3);
    const season = await currentSeason(testDb);
    expect(season.dayOne).toBe("2026-09-25");
    const wall = await listWall(testDb, season.id, { limit: 100 });
    expect(wall.length).toBeGreaterThanOrEqual(24);
    expect(Math.max(...wall.map((w) => w.post.day))).toBe(23);
    expect(wall.every((w) => w.post.mediaUrl === null)).toBe(true);
  });

  it("is idempotent: a second run leaves identical row counts", async () => {
    const before = await tableCounts(testDb);
    await seedDemo(testDb, NOW);
    expect(await tableCounts(testDb)).toEqual(before);
  });

  it("covers every feature with the counts the brief names", async () => {
    const c = await tableCounts(testDb);
    expect(c).toMatchObject({
      members: 3,
      delusions: 4,
      spoilers: 2,
      jar_items: 5,
      dares: 2,
      bets: 2,
      bombs: 1,
      prophecies: 2,
      truth_answers: 15,
      tracks: 6,
      manifesto_versions: 2,
    });
    expect(c.reactions).toBeGreaterThan(0);
    expect(c.comments).toBeGreaterThan(0);
    expect(c.track_comments).toBeGreaterThan(0);
  });

  it("reset wipes and reseeds to the same counts", async () => {
    const before = await tableCounts(testDb);
    await seedDemo(testDb, NOW, { reset: true });
    expect(await tableCounts(testDb)).toEqual(before);
  });

  it("tableCounts covers every table in the schema", async () => {
    const tables = Object.values(schema).filter((t) => t instanceof PgTable);
    expect(Object.keys(await tableCounts(testDb))).toHaveLength(tables.length);
  });
});

describe("GET /api/demo-reset (Vercel cron)", () => {
  const get = (auth?: string) =>
    GET(new Request("http://x/api/demo-reset", { headers: auth ? { authorization: auth } : {} }));
  it("reseeds with the valid secret", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    vi.stubEnv("CRON_SECRET", "s3cret");
    await testDb.delete(schema.reactions);
    expect((await get("Bearer s3cret")).status).toBe(200);
    expect((await tableCounts(testDb)).reactions).toBeGreaterThan(0);
  });
  it("404s without the secret", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await get()).status).toBe(404);
    expect((await get("Bearer nope")).status).toBe(404);
  });
  it("404s outside demo mode even with the secret", async () => {
    vi.stubEnv("DEMO_MODE", undefined);
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await get("Bearer s3cret")).status).toBe(404);
  });
});

describe("POST /api/demo-reset", () => {
  it("404s outside demo mode even with a valid secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubEnv("DEMO_MODE", undefined);
    expect((await call("Bearer s3cret")).status).toBe(404);
  });
  it("404s when CRON_SECRET is unset, whatever the header says", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    vi.stubEnv("CRON_SECRET", undefined);
    expect((await call("Bearer ")).status).toBe(404);
    expect((await call("Bearer undefined")).status).toBe(404);
  });
  it("404s for a wrong, longer or missing secret", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await call("Bearer nope")).status).toBe(404);
    expect((await call("Bearer s3cret-longer")).status).toBe(404);
    expect((await call()).status).toBe(404);
  });
  it("a valid call really reseeds", async () => {
    vi.stubEnv("DEMO_MODE", "1");
    vi.stubEnv("CRON_SECRET", "s3cret");
    await testDb.delete(schema.reactions);
    await testDb.delete(schema.comments);
    expect((await tableCounts(testDb)).reactions).toBe(0);
    const res = await call("Bearer s3cret");
    expect(res.status).toBe(200);
    const after = await tableCounts(testDb);
    expect(after.reactions).toBeGreaterThan(0);
    expect(after.posts).toBeGreaterThanOrEqual(24);
  });
});
