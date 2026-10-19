import { and, arrayContains, asc, count, eq, gt, isNotNull, isNull, max, or } from "drizzle-orm";
import { STRINGS } from "@/lib/content/strings";
import { dayNumber, propheciesSealed, TOTAL_DAYS } from "@/lib/days";
import type { Db } from "@/lib/db/client";
import {
  type Bomb,
  type BombEvent,
  type BombTrigger,
  bombs,
  dares,
  jarItems,
  posts,
  prophecies,
} from "@/lib/db/schema";
import { type MemberId, memberExists } from "@/lib/members";
import { seasonById } from "@/lib/repo/seasons";
import { postAndClaim } from "@/lib/repo/section-post";
import { skinById } from "@/lib/repo/skins";

export const BOMB_MAX = 500;

/** What the sender picks when arming. `day` is the only kind with a fixed date. */
export type BombArmTrigger =
  | { kind: "day"; detonateDay: number }
  | { kind: "count"; stamp: string; target: number }
  | { kind: "event"; event: BombEvent };

/**
 * What a bomb shows while it waits. There is deliberately no detonateDay here: it is null for
 * count and event bombs, and a nullable number in a view invites `Math.max(0, null - day)`,
 * which is 0, so every conditional bomb would render as going off right now.
 */
export type BombFuse =
  | { kind: "day"; daysLeft: number; percent: number }
  | { kind: "count"; stamp: string; have: number; target: number; percent: number }
  | { kind: "event"; event: BombEvent };

export type BombView = {
  id: number;
  sender: MemberId;
  recipient: MemberId;
  armedDay: number;
  mine: boolean;
  detonated: boolean;
  /** Trigger satisfied and nobody has opened it. This is what puts it in YOUR MOVE. */
  due: boolean;
  fuse: BombFuse;
  /** Null for the recipient until it goes off. The words never leave the server before then. */
  body: string | null;
};

export async function armBomb(
  db: Db,
  input: {
    seasonId: number;
    sender: MemberId;
    recipient: MemberId;
    body: string;
    skinId: number;
    trigger: BombArmTrigger;
  },
  today: number,
  now: Date = new Date(),
): Promise<Bomb> {
  const body = input.body.trim();
  if (body.length === 0 || body.length > BOMB_MAX)
    throw new Error(`A note must be 1 to ${BOMB_MAX} characters`);
  const { trigger } = input;
  const { recipient } = input;
  if (recipient === input.sender) throw new Error("You cannot send a bomb to yourself");
  if (!(await memberExists(db, recipient))) throw new Error("No such member");
  if (trigger.kind === "day") {
    if (trigger.detonateDay <= today) throw new Error("Pick a day after today");
    if (trigger.detonateDay > TOTAL_DAYS)
      throw new Error(`Nothing goes off after Day ${TOTAL_DAYS}`);
  } else if (trigger.kind === "count") {
    // Mirrors the day guard above: a target already met would be due the instant it is armed.
    if (!Number.isInteger(trigger.target) || trigger.target < 1)
      throw new Error("Pick a number to count to");
    const have = await countStamp(db, input.seasonId, recipient, trigger.stamp);
    if (have >= trigger.target) throw new Error(STRINGS.bombs.already);
  } else if (trigger.kind === "event") {
    // The mirror of the count guard, for the opposite failure. A prophecy cannot be written
    // after day 7 (addProphecy throws once propheciesSealed), so a bomb waiting on one armed
    // from day 8 could NEVER be due: it would sit in the drawer and the forward view saying
    // WAITING until day 100 with nothing able to release it.
    if (trigger.event === "prophecy_sealed" && propheciesSealed(today))
      throw new Error(STRINGS.bombs.already);
  }
  // Checked here rather than at detonation, so the sender hears about it while they can fix it.
  const skin = await skinById(db, input.skinId);
  if (!skin || skin.seasonId !== input.seasonId || skin.owner !== input.sender)
    throw new Error("Pick one of your own skins");
  const [bomb] = await db
    .insert(bombs)
    .values({
      seasonId: input.seasonId,
      sender: input.sender,
      recipient,
      body,
      skinId: input.skinId,
      armedDay: today,
      detonateDay: trigger.kind === "day" ? trigger.detonateDay : null,
      triggerKind: trigger.kind,
      // The watermark IS the arming moment: without it, every pre-existing row of that kind
      // would satisfy "next time X happens" the instant the bomb goes live.
      triggerPayload:
        trigger.kind === "count"
          ? { kind: "count", stamp: trigger.stamp, target: trigger.target }
          : trigger.kind === "event"
            ? { kind: "event", event: trigger.event, after: now.toISOString() }
            : null,
    })
    .returning();
  return bomb;
}

export async function bombById(db: Db, id: number, seasonId: number): Promise<Bomb | undefined> {
  const [row] = await db
    .select()
    .from(bombs)
    .where(and(eq(bombs.id, id), eq(bombs.seasonId, seasonId)))
    .limit(1);
  return row;
}

/**
 * Claims the detonation atomically: the nightly rollover and a manual open can race, and the
 * update only matches while postId is still null, so two callers on the same bomb leave one post.
 */
export async function detonate(db: Db, bomb: Bomb, now: Date): Promise<number | null> {
  const post = await postAndClaim(
    db,
    {
      seasonId: bomb.seasonId,
      author: bomb.sender,
      skinId: bomb.skinId,
      source: "bomb",
      type: "text",
      body: bomb.body,
    },
    (postId) =>
      db
        .update(bombs)
        .set({ postId })
        .where(and(eq(bombs.id, bomb.id), isNull(bombs.postId)))
        .returning({ id: bombs.id }),
    now,
  );
  return post?.id ?? null;
}

/** A bomb is always aimed at the other player, so every trigger is measured against them. */
type Facts = {
  stamps: Map<string, number>;
  events: Map<string, string | null>;
};

const stampKey = (p: MemberId, stamp: string) => `${p}:${stamp}`;
const eventKey = (p: MemberId, e: BombEvent) => `${p}:${e}`;

async function countStamp(db: Db, seasonId: number, who: MemberId, stamp: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(posts)
    .where(
      and(
        eq(posts.seasonId, seasonId),
        eq(posts.author, who),
        isNull(posts.deletedAt),
        arrayContains(posts.stamps, [stamp]),
      ),
    );
  return Number(row?.n ?? 0);
}

async function latestEvent(
  db: Db,
  seasonId: number,
  who: MemberId,
  event: BombEvent,
  after: string,
): Promise<string | null> {
  const since = new Date(after);
  if (event === "jar_add") {
    const [r] = await db
      .select({ t: max(jarItems.createdAt) })
      .from(jarItems)
      .where(
        and(
          eq(jarItems.seasonId, seasonId),
          eq(jarItems.author, who),
          gt(jarItems.createdAt, since),
        ),
      );
    return r?.t ? new Date(r.t).toISOString() : null;
  }
  if (event === "dare_dealt") {
    const [r] = await db
      .select({ t: max(dares.createdAt) })
      .from(dares)
      .where(and(eq(dares.seasonId, seasonId), eq(dares.darer, who), gt(dares.createdAt, since)));
    return r?.t ? new Date(r.t).toISOString() : null;
  }
  if (event === "prophecy_sealed") {
    const [r] = await db
      .select({ t: max(prophecies.createdAt) })
      .from(prophecies)
      .where(
        and(
          eq(prophecies.seasonId, seasonId),
          eq(prophecies.author, who),
          gt(prophecies.createdAt, since),
        ),
      );
    return r?.t ? new Date(r.t).toISOString() : null;
  }
  const [r] = await db
    .select({ t: max(posts.createdAt) })
    .from(posts)
    .where(
      and(
        eq(posts.seasonId, seasonId),
        eq(posts.author, who),
        isNull(posts.deletedAt),
        gt(posts.createdAt, since),
      ),
    );
  return r?.t ? new Date(r.t).toISOString() : null;
}

/**
 * Gathers only what the loaded bombs actually reference, so the common case of nothing but
 * day bombs costs no extra queries at all.
 */
async function gather(db: Db, seasonId: number, rows: Bomb[]): Promise<Facts> {
  const stamps = new Map<string, number>();
  const events = new Map<string, string | null>();
  for (const b of rows) {
    const t = b.triggerPayload;
    if (b.triggerKind === "count" && t && "stamp" in t) {
      const k = stampKey(b.recipient, t.stamp);
      if (!stamps.has(k)) stamps.set(k, await countStamp(db, seasonId, b.recipient, t.stamp));
    }
    if (b.triggerKind === "event" && t && "event" in t) {
      const k = eventKey(b.recipient, t.event);
      if (!events.has(k))
        events.set(k, await latestEvent(db, seasonId, b.recipient, t.event, t.after));
    }
  }
  return { stamps, events };
}

function pct(have: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((have / target) * 100)));
}

function readFuse(b: Bomb, facts: Facts, day: number): { due: boolean; fuse: BombFuse } {
  const t = b.triggerPayload as BombTrigger | null;
  if (b.triggerKind === "count" && t && "stamp" in t) {
    const have = facts.stamps.get(stampKey(b.recipient, t.stamp)) ?? 0;
    return {
      due: have >= t.target,
      fuse: { kind: "count", stamp: t.stamp, have, target: t.target, percent: pct(have, t.target) },
    };
  }
  if (b.triggerKind === "event" && t && "event" in t) {
    return {
      due: facts.events.get(eventKey(b.recipient, t.event)) !== null,
      fuse: { kind: "event", event: t.event },
    };
  }
  // Day, and the fallback for a payload that does not match its kind: never silently due.
  const target = b.detonateDay ?? TOTAL_DAYS;
  const span = target - b.armedDay;
  return {
    due: day >= target,
    fuse: {
      kind: "day",
      daysLeft: Math.max(0, target - day),
      percent: span <= 0 ? 100 : pct(day - b.armedDay, span),
    },
  };
}

/**
 * The fuse as one line: a countdown, a tally, or "waiting", plus a bar where there is progress
 * to show. Shared by the wall's ticking-bomb strip and the all-clear forward view so the two
 * can never word the same fuse differently. Never touches the body, so it is safe for the
 * recipient's screen while the note is still sealed.
 */
export function bombFuseLine(fuse: BombFuse): { detail: string; bar: number | null } {
  if (fuse.kind === "count")
    return {
      detail: `${STRINGS.bombs.progress(fuse.have, fuse.target)} ${STRINGS.stamps[fuse.stamp] ?? fuse.stamp}`,
      bar: fuse.percent,
    };
  if (fuse.kind === "event") return { detail: STRINGS.bombs.waiting, bar: null };
  return { detail: STRINGS.bombs.dMinus(fuse.daysLeft), bar: fuse.percent };
}

export async function bombsFor(
  db: Db,
  seasonId: number,
  viewer: MemberId,
  day: number,
): Promise<BombView[]> {
  const rows = await db
    .select()
    .from(bombs)
    .where(
      and(
        eq(bombs.seasonId, seasonId),
        // Armed bombs are for the two people in them; once open the post is public anyway.
        or(eq(bombs.sender, viewer), eq(bombs.recipient, viewer), isNotNull(bombs.postId)),
      ),
    )
    // detonateDay is null for count and event bombs and Postgres sorts nulls last with no
    // tiebreak, so without the id two of them swap places between loads and Terminal's
    // "PAYLOAD 2" becomes "PAYLOAD 3".
    .orderBy(asc(bombs.detonateDay), asc(bombs.id));
  const facts = await gather(db, seasonId, rows);
  return rows.map((b) => {
    const detonated = b.postId !== null;
    const mine = b.sender === viewer;
    const { due, fuse } = readFuse(b, facts, day);
    return {
      id: b.id,
      sender: b.sender,
      recipient: b.recipient,
      armedDay: b.armedDay,
      mine,
      detonated,
      due: due && !detonated,
      fuse,
      body: mine || detonated ? b.body : null,
    };
  });
}

/**
 * The recipient opens their own bomb once its trigger is satisfied. Guarded here, not in the
 * action, matching this repo's dominant convention (bets.ts answer()): the repo owns who and
 * when, so a client can never open a bomb early by calling the action directly.
 */
export async function openBomb(
  db: Db,
  input: { id: number; seasonId: number; viewer: MemberId },
  now: Date,
): Promise<number | null> {
  const bomb = await bombById(db, input.id, input.seasonId);
  if (!bomb) throw new Error("No such bomb");
  if (input.viewer !== bomb.recipient) throw new Error("Only the recipient opens a bomb");
  // Already open. The claim inside detonate would reject the second post and soft-delete it,
  // so nothing duplicates, but it burns a row per tap and reports success either way.
  if (bomb.postId !== null) return bomb.postId;
  const season = await seasonById(db, input.seasonId);
  if (!season) throw new Error("No such season");
  const day = dayNumber(now, season.dayOne, season.timezone);
  const facts = await gather(db, input.seasonId, [bomb]);
  const { due } = readFuse(bomb, facts, day);
  if (!due) throw new Error("Not due yet");
  return detonate(db, bomb, now);
}
