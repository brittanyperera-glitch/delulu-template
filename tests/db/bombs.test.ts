import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { bombs, jarItems } from "@/lib/db/schema";
import { createTestDb, currentSeason } from "@/lib/db/test-db";
import {
  armBomb,
  type BombArmTrigger,
  bombById,
  bombsFor,
  detonate,
  openBomb,
} from "@/lib/repo/bombs";
import { createPost, listWall } from "@/lib/repo/posts";
import { createSkin } from "@/lib/repo/skins";
import { applyRollover } from "@/lib/rollover";

const on = (ymd: string) => new Date(`${ymd}T12:00:00Z`);
const onDay = (detonateDay: number): BombArmTrigger => ({ kind: "day", detonateDay });

async function setup() {
  const db = await createTestDb();
  const season = await currentSeason(db);
  const alex = await createSkin(db, { seasonId: season.id, owner: "alex", name: "CEO Alex" });
  const sam = await createSkin(db, { seasonId: season.id, owner: "sam", name: "Marathon" });
  return { db, seasonId: season.id, alex, sam };
}

describe("arming", () => {
  it("goes to the other player on a day after today, under your own skin", async () => {
    const { db, seasonId, alex } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(9),
      },
      3,
    );
    expect(bomb.recipient).toBe("sam");
    expect(bomb.armedDay).toBe(3);
    expect(bomb.postId).toBeNull();
  });

  it("refuses today, the past, past Day 100, and the other person's skin", async () => {
    const { db, seasonId, alex, sam } = await setup();
    const base = {
      seasonId,
      sender: "alex" as const,
      recipient: "sam" as const,
      body: "look up",
      skinId: alex.id,
    };
    await expect(armBomb(db, { ...base, trigger: onDay(3) }, 3)).rejects.toThrow(/after today/i);
    await expect(armBomb(db, { ...base, trigger: onDay(2) }, 3)).rejects.toThrow(/after today/i);
    await expect(armBomb(db, { ...base, trigger: onDay(101) }, 3)).rejects.toThrow(/Day 100/);
    await expect(armBomb(db, { ...base, skinId: sam.id, trigger: onDay(9) }, 3)).rejects.toThrow(
      /skin/i,
    );
    await expect(armBomb(db, { ...base, body: " ", trigger: onDay(9) }, 3)).rejects.toThrow(
      /note/i,
    );
  });

  it("arms a count trigger below the recipient's current total", async () => {
    const { db, seasonId, alex, sam } = await setup();
    await createPost(db, {
      seasonId,
      author: "sam",
      skinId: sam.id,
      type: "text",
      body: "one",
      stamps: ["W"],
    });
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "big dubs incoming",
        skinId: alex.id,
        trigger: { kind: "count", stamp: "W", target: 5 },
      },
      3,
    );
    expect(bomb.triggerKind).toBe("count");
    expect(bomb.triggerPayload).toEqual({ kind: "count", stamp: "W", target: 5 });
    expect(bomb.detonateDay).toBeNull();
  });

  it("refuses a count target the recipient has already reached", async () => {
    const { db, seasonId, alex, sam } = await setup();
    await createPost(db, {
      seasonId,
      author: "sam",
      skinId: sam.id,
      type: "text",
      body: "one",
      stamps: ["W"],
    });
    await createPost(db, {
      seasonId,
      author: "sam",
      skinId: sam.id,
      type: "text",
      body: "two",
      stamps: ["W"],
    });
    await expect(
      armBomb(
        db,
        {
          seasonId,
          sender: "alex",
          recipient: "sam",
          body: "gotcha",
          skinId: alex.id,
          trigger: { kind: "count", stamp: "W", target: 2 },
        },
        3,
      ),
    ).rejects.toThrow(/already/i);
  });

  it("arms an event trigger with the arming moment as its watermark", async () => {
    const { db, seasonId, alex } = await setup();
    const armedAt = on("2026-09-03");
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "surprise",
        skinId: alex.id,
        trigger: { kind: "event", event: "jar_add" },
      },
      3,
      armedAt,
    );
    expect(bomb.triggerKind).toBe("event");
    expect(bomb.triggerPayload).toEqual({
      kind: "event",
      event: "jar_add",
      after: armedAt.toISOString(),
    });
    expect(bomb.detonateDay).toBeNull();
  });

  it("does not detonate an event trigger on jar activity from before it was armed", async () => {
    const { db, seasonId, alex } = await setup();
    // Predates the bomb entirely: without the arming-moment watermark this would already
    // satisfy "next time sam adds to the jar" the instant the bomb goes live.
    await db.insert(jarItems).values({
      seasonId,
      author: "sam",
      body: "already there",
      size: "tiny",
      createdAt: on("2026-09-01"),
    });
    await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "surprise",
        skinId: alex.id,
        trigger: { kind: "event", event: "jar_add" },
      },
      5,
      on("2026-09-05"),
    );
    const [before] = await bombsFor(db, seasonId, "alex", 5);
    expect(before.due).toBe(false);

    await db.insert(jarItems).values({
      seasonId,
      author: "sam",
      body: "new one",
      size: "tiny",
      createdAt: on("2026-09-06"),
    });
    const [after] = await bombsFor(db, seasonId, "alex", 6);
    expect(after.due).toBe(true);
  });
});

describe("what each side can see", () => {
  it("keeps the words from the recipient until it goes off", async () => {
    const { db, seasonId, alex } = await setup();
    await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(9),
      },
      3,
    );
    const [asSender] = await bombsFor(db, seasonId, "alex", 3);
    expect(asSender.mine).toBe(true);
    expect(asSender.body).toBe("look up");
    const [asRecipient] = await bombsFor(db, seasonId, "sam", 3);
    expect(asRecipient.mine).toBe(false);
    expect(asRecipient.body).toBeNull();
    expect(asRecipient.sender).toBe("alex");
    expect(asRecipient.due).toBe(false);
    expect(asRecipient.fuse).toEqual({ kind: "day", daysLeft: 6, percent: 0 });
  });

  it("shows the words to both once it has detonated", async () => {
    const { db, seasonId, alex } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(4),
      },
      3,
    );
    // A real post, not a bare literal id: bombs.post_id is a foreign key to posts.id.
    const post = await createPost(db, {
      seasonId,
      author: "alex",
      skinId: alex.id,
      type: "text",
      body: "look up",
      source: "bomb",
      stamps: ["TIME BOMB"],
    });
    await db.update(bombs).set({ postId: post.id }).where(eq(bombs.id, bomb.id));
    const [view] = await bombsFor(db, seasonId, "sam", 4);
    expect(view.detonated).toBe(true);
    expect(view.body).toBe("look up");
    expect(view.due).toBe(false);
  });
});

describe("the day fuse", () => {
  it("does not report 100% while its day is still in the future", async () => {
    const { db, seasonId, alex } = await setup();
    await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(8),
      },
      4,
    );
    const [mid] = await bombsFor(db, seasonId, "sam", 6);
    expect(mid.fuse).toEqual({ kind: "day", daysLeft: 2, percent: 50 });
    expect(mid.due).toBe(false);
    const [done] = await bombsFor(db, seasonId, "sam", 8);
    expect(done.fuse).toEqual({ kind: "day", daysLeft: 0, percent: 100 });
    expect(done.due).toBe(true);
  });
});

describe("the count fuse", () => {
  it("is not due below its target and is due at it", async () => {
    const { db, seasonId, alex, sam } = await setup();
    await db.insert(bombs).values({
      seasonId,
      sender: "alex",
      recipient: "sam",
      body: "hit your number",
      skinId: alex.id,
      armedDay: 1,
      triggerKind: "count",
      triggerPayload: { kind: "count", stamp: "W", target: 2 },
    });
    const [before] = await bombsFor(db, seasonId, "alex", 5);
    expect(before.due).toBe(false);
    expect(before.fuse).toEqual({ kind: "count", stamp: "W", have: 0, target: 2, percent: 0 });

    await createPost(db, {
      seasonId,
      author: "sam",
      skinId: sam.id,
      type: "text",
      body: "one",
      stamps: ["W"],
    });
    const [halfway] = await bombsFor(db, seasonId, "alex", 5);
    expect(halfway.due).toBe(false);
    expect(halfway.fuse).toEqual({ kind: "count", stamp: "W", have: 1, target: 2, percent: 50 });

    await createPost(db, {
      seasonId,
      author: "sam",
      skinId: sam.id,
      type: "text",
      body: "two",
      stamps: ["W"],
    });
    const [after] = await bombsFor(db, seasonId, "alex", 5);
    expect(after.due).toBe(true);
    expect(after.fuse).toEqual({ kind: "count", stamp: "W", have: 2, target: 2, percent: 100 });
  });
});

describe("opening", () => {
  it("refuses a bomb from another season, a viewer who is not the recipient, and one not due yet", async () => {
    const { db, seasonId, alex } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(9),
      },
      3,
    );
    await expect(
      openBomb(db, { id: bomb.id, seasonId: seasonId + 1, viewer: "sam" }, on("2026-09-10")),
    ).rejects.toThrow(/no such bomb/i);
    await expect(
      openBomb(db, { id: bomb.id, seasonId, viewer: "alex" }, on("2026-09-10")),
    ).rejects.toThrow(/recipient/i);
    await expect(
      openBomb(db, { id: bomb.id, seasonId, viewer: "sam" }, on("2026-09-05")),
    ).rejects.toThrow(/not due/i);
  });

  it("opens a due bomb once, on the sender's skin, with the TIME BOMB stamp", async () => {
    const { db, seasonId, alex } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(9),
      },
      3,
    );
    const id = await openBomb(db, { id: bomb.id, seasonId, viewer: "sam" }, on("2026-09-10"));
    expect(id).not.toBeNull();
    const items = await listWall(db, seasonId);
    expect(items).toHaveLength(1);
    expect(items[0].post.stamps).toEqual(["TIME BOMB"]);
    expect(items[0].post.author).toBe("alex");
    expect(items[0].post.skinId).toBe(bomb.skinId);
    expect(items[0].post.body).toBe("look up");
    expect((await db.select().from(bombs).where(eq(bombs.id, bomb.id)))[0].postId).toBe(
      items[0].post.id,
    );
  });

  // The contract changed deliberately, and this asserts MORE than it used to, not less.
  // Opening an already-open bomb used to fall through to detonate, fail its claim, soft-delete
  // the post it had just written and return null: no duplicate, but a wasted row per tap.
  // It now short-circuits and hands back the post that already exists, so a second open is
  // idempotent. The invariant that matters, one post on the wall, is still asserted.
  it("a second open on an already-detonated bomb returns the same post", async () => {
    const { db, seasonId, alex } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(9),
      },
      3,
    );
    const first = await openBomb(db, { id: bomb.id, seasonId, viewer: "sam" }, on("2026-09-10"));
    expect(first).not.toBeNull();
    const second = await openBomb(db, { id: bomb.id, seasonId, viewer: "sam" }, on("2026-09-10"));
    expect(second).toBe(first);
    expect(await listWall(db, seasonId)).toHaveLength(1);
  });

  it("two concurrent opens leave one post", async () => {
    const { db, seasonId, alex } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(9),
      },
      3,
    );
    const [a, b] = await Promise.all([
      openBomb(db, { id: bomb.id, seasonId, viewer: "sam" }, on("2026-09-10")),
      openBomb(db, { id: bomb.id, seasonId, viewer: "sam" }, on("2026-09-10")),
    ]);
    expect([a, b].filter((x) => x !== null)).toHaveLength(1);
    expect(await listWall(db, seasonId)).toHaveLength(1);
  });

  it("the writer that loses the claim discards its own post", async () => {
    const { db, seasonId, alex } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(9),
      },
      3,
    );
    const loaded = await bombById(db, bomb.id, seasonId);
    if (!loaded) throw new Error("expected bomb");
    const won = await detonate(db, loaded, on("2026-09-10"));
    expect(won).not.toBeNull();
    const lost = await detonate(db, loaded, on("2026-09-10"));
    expect(lost).toBeNull();
    expect(await listWall(db, seasonId)).toHaveLength(1);
  });
});

describe("bombs, the contract this branch changed", () => {
  // The flip: a bomb past its day used to post itself on the next rollover. It now waits to
  // be opened. That was unguarded in BOTH directions, so a future change could quietly put
  // the sweep back and nothing would say so.
  it("does not post a due bomb by itself, and reports it as due", async () => {
    const { db, seasonId, alex } = await setup();
    const season = await currentSeason(db);
    await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "look up",
        skinId: alex.id,
        trigger: onDay(9),
      },
      3,
    );
    await applyRollover(db, season, on("2026-09-12"));
    expect(await listWall(db, seasonId)).toHaveLength(0);

    const views = await bombsFor(db, seasonId, "sam", 11);
    expect(views).toHaveLength(1);
    expect(views[0].due).toBe(true);
    expect(views[0].detonated).toBe(false);
  });

  // A prophecy cannot be written after day 7, so a bomb waiting on one armed from day 8
  // could never be due: it would sit in the drawer saying WAITING until day 100 with
  // nothing able to release it. The mirror of the count guard.
  it("refuses an event trigger that can no longer happen", async () => {
    const { db, seasonId, alex } = await setup();
    await expect(
      armBomb(
        db,
        {
          seasonId,
          sender: "alex",
          recipient: "sam",
          body: "too late",
          skinId: alex.id,
          trigger: { kind: "event", event: "prophecy_sealed" },
        },
        20,
      ),
    ).rejects.toThrow();
  });

  it("still allows that trigger while prophecies can be written", async () => {
    const { db, seasonId, alex } = await setup();
    const bomb = await armBomb(
      db,
      {
        seasonId,
        sender: "alex",
        recipient: "sam",
        body: "in time",
        skinId: alex.id,
        trigger: { kind: "event", event: "prophecy_sealed" },
      },
      3,
    );
    expect(bomb.triggerKind).toBe("event");
  });
});
