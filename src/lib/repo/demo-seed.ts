import { getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { localDate } from "@/lib/days";
import type { Db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { saveVersion } from "@/lib/manifesto";
import { loadMembers } from "@/lib/members";
import { acceptBet, proposeBet } from "@/lib/repo/bets";
import { armBomb } from "@/lib/repo/bombs";
import { acceptDare, proposeDare } from "@/lib/repo/dares";
import { addDelusion } from "@/lib/repo/delusions";
import { addJarItem } from "@/lib/repo/jar";
import { insertMembers } from "@/lib/repo/members";
import { createPost } from "@/lib/repo/posts";
import { addProphecy } from "@/lib/repo/prophecies";
import { addComment, toggleReaction } from "@/lib/repo/reactions";
import { activeSeason, startSeason } from "@/lib/repo/seasons";
import { createSkin } from "@/lib/repo/skins";
import { addSpoiler } from "@/lib/repo/spoilers";
import { addTrackComment } from "@/lib/repo/track-comments";
import { addTrack, approveTrack } from "@/lib/repo/tracks";
import { answer } from "@/lib/repo/truth";

const DAY_MS = 86_400_000;
const TODAY = 23;
const TABLES = Object.values(schema).filter((t) => is(t, PgTable)) as unknown as PgTable[];

/** Row count per table, keyed by SQL table name. */
export async function tableCounts(db: Db): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of TABLES) {
    const res = await db.execute(sql`select count(*)::int as n from ${t}`);
    const rows = (Array.isArray(res) ? res : (res as { rows: unknown[] }).rows) as { n: number }[];
    out[getTableName(t)] = Number(rows[0].n);
  }
  return out;
}

// One statement, so it also works on the Neon HTTP driver, which has no transactions.
async function wipe(db: Db): Promise<void> {
  const names = TABLES.map((t) => `"${getTableName(t)}"`).join(", ");
  await db.execute(sql.raw(`truncate table ${names} restart identity cascade`));
}

const MEMBERS = [
  { slug: "alex", name: "Alex", colour: "mustard" },
  { slug: "sam", name: "Sam", colour: "sky" },
  { slug: "jo", name: "Jo", colour: "rose" },
] as const;

const SKIN_NAMES = [
  ["Main Character", "Night Owl"],
  ["Snack Critic", "Quiet Hero"],
  ["Plant Parent", "Chaos Cook"],
];

const POST_DAYS = [
  1, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 10, 10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 22, 23,
];
const POST_BODIES = [
  "Day one. Bought a notebook to prove I mean it.",
  "Walked the long way home and counted four dogs.",
  "Made soup from whatever was left in the fridge.",
  "Finished the book I started in spring.",
  "Learned one chord. It sounds like a door.",
  "Watered the plant. It looked unimpressed.",
  "Sunday reset: laundry, tea, one good playlist.",
  "Said hi to a stranger and survived.",
  "Tried a new bakery. Review: yes.",
  "Week one done. Proud of us.",
  "Rained all day, so we built a blanket fort.",
  "Cooked something with more than three steps.",
  "Cycled to the lake and back.",
  "Took a photo of the sky in my head.",
  "Dropped a plate. Called it art.",
  "Wrote a postcard I may never send.",
  "Tidied one drawer. Just one.",
  "Found a park bench with a view.",
  "Sang in the shower like it was a stadium.",
  "Cooked for friends and nothing burned.",
  "Early train, good coffee, slow morning.",
  "Rearranged the shelf. Feels like a new room.",
  "Learned a card trick and ruined it twice.",
  "Day 23. Still going, still delulu.",
  "Made a list of small things to look forward to.",
];

const COMMENTS = ["Love this.", "Same, honestly.", "Tell me more.", "This made my day."];
const REACTIONS = ["wicked", "big time", "ur the goat"];

// One row per day, TODAY - 4 to TODAY, answering that day's prompt in TRUTH_OR_TRUTH, in member order.
const TRUTH_ANSWERS = [
  ["The Great Sourdough Heist", "Forty Minutes of Emails", "Pigeons: A Love Story"],
  [
    "My parallel parking, frankly.",
    "Making a very good omelette.",
    "Being early. I am always early.",
  ],
  [
    "Sam's habit of stretching every morning.",
    "Jo's habit of writing things down.",
    "Alex's habit of leaving on time.",
  ],
  [
    "A tiny desk plant. Still thinking about it.",
    "A bicycle bell. Every bike needs one.",
    "The big notebook. It was on sale.",
  ],
  [
    "That I could win a quiz show unprepared.",
    "That I am good at charades.",
    "That I can fix anything with tape.",
  ],
] as const;

const TRACKS = [
  ["Golden Hour Loop", "The Paper Kites"],
  ["Slow Bicycle", "Maple Static"],
  ["Rooftop Weather", "Juniper Lane"],
  ["Kitchen Dancing", "Soft Gears"],
  ["Late Bus Home", "Small Orbit"],
  ["Sunday Light", "Pine and Tide"],
] as const;

// The spoiler table needs an image URL and the demo has no uploads, so this is an inline swatch.
const swatch = (hex: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${hex}"/></svg>`,
  )}`;

/**
 * Fills an empty database with fake data through the same repo functions the app uses.
 * Without `reset` it does nothing when a season already exists, so a second run is a no-op
 * and a real database is never touched. `reset` wipes every table first.
 */
export async function seedDemo(
  db: Db,
  now: Date,
  opts: { reset?: boolean } = {},
): Promise<{ seeded: boolean }> {
  if (opts.reset) await wipe(db);
  else if (await activeSeason(db)) return { seeded: false };

  await insertMembers(db, MEMBERS);
  const dayOne = localDate(new Date(now.getTime() - (TODAY - 1) * DAY_MS), "UTC");
  const season = await startSeason(db, dayOne, "UTC");
  const seasonId = season.id;
  const members = await loadMembers(db);
  const ids = Object.keys(members);
  const at = (day: number) => new Date(now.getTime() - (TODAY - day) * DAY_MS);

  const skinIds: Record<string, number[]> = {};
  for (const [i, m] of MEMBERS.entries()) {
    skinIds[m.slug] = [];
    for (const name of SKIN_NAMES[i]) {
      const skin = await createSkin(db, { seasonId, owner: m.slug, name, paper: m.colour });
      skinIds[m.slug].push(skin.id);
    }
  }

  const postIds: number[] = [];
  for (const [i, day] of POST_DAYS.entries()) {
    const author = ids[i % ids.length];
    const post = await createPost(
      db,
      {
        seasonId,
        author,
        skinId: skinIds[author][i % 2],
        type: "text",
        body: POST_BODIES[i],
        stamps: i % 6 === 5 ? ["W"] : i % 9 === 8 ? ["L"] : [],
      },
      at(day),
    );
    postIds.push(post.id);
  }
  for (const [i, postId] of postIds.entries()) {
    if (i % 3 !== 0) continue;
    const other = ids[(i + 1) % ids.length];
    await toggleReaction(db, postId, other, REACTIONS[i % REACTIONS.length]);
    if (i % 2 === 0) await addComment(db, postId, ids[(i + 2) % ids.length], COMMENTS[i % 4]);
  }

  const [alex, sam, jo] = ids;
  const delusions = [
    [alex, "Will learn to bake bread that does not double as a doorstop."],
    [sam, "Will run a 5k without bargaining."],
    [jo, "Will finish one hobby before starting the next."],
    [alex, "Will keep a plant alive all summer."],
  ] as const;
  for (const [about, body] of delusions)
    await addDelusion(db, { seasonId, about, addedBy: ids[(ids.indexOf(about) + 1) % 3], body });

  await addSpoiler(db, { seasonId, imageUrl: swatch("#e0a526"), line: "Day 50 vibes." });
  await addSpoiler(db, { seasonId, imageUrl: swatch("#7a8a5e"), line: "Somewhere green." });

  const jar = [
    ["Share a snack you have never tried.", "tiny"],
    ["Cook dinner with a random ingredient.", "tonight"],
    ["Plan a day trip by train.", "weekend"],
    ["Pick a hobby to try together.", "planning"],
    ["Wear something ridiculous outside.", "feral"],
  ] as const;
  for (const [body, size] of jar) await addJarItem(db, { seasonId, author: sam, body, size });

  const d1 = await proposeDare(db, {
    seasonId,
    darer: alex,
    dared: sam,
    body: "Talk in rhymes for one whole dinner.",
    stake: "Loser washes up.",
  });
  await acceptDare(db, d1.id, sam);
  await proposeDare(db, { seasonId, darer: sam, dared: jo, body: "Wear a hat all day." });

  await proposeBet(db, {
    seasonId,
    proposer: alex,
    opponent: jo,
    claim: "It rains on the day of the picnic.",
    stakes: "Loser buys ice cream.",
  });
  const accepted = await proposeBet(db, {
    seasonId,
    proposer: sam,
    opponent: alex,
    claim: "I can hold a plank for three minutes.",
    stakes: "Loser plans next weekend.",
  });
  await acceptBet(db, accepted.id, alex);

  await armBomb(
    db,
    {
      seasonId,
      sender: jo,
      recipient: sam,
      body: "Open this on a bad day. You are doing fine.",
      skinId: skinIds[jo][0],
      trigger: { kind: "day", detonateDay: 30 },
    },
    TODAY,
    now,
  );

  await addProphecy(db, { seasonId, author: alex, about: sam, body: "has adopted a cat." }, 3);
  await addProphecy(
    db,
    { seasonId, author: jo, about: jo, body: "has finally finished the puzzle." },
    5,
  );

  for (let day = TODAY - 4; day <= TODAY; day++)
    // today = day keeps the answers editable, as they were on that day.
    for (const [i, author] of ids.entries())
      await answer(
        db,
        { seasonId, day, author, body: TRUTH_ANSWERS[day - (TODAY - 4)][i] },
        ids,
        day,
      );

  for (const [i, [title, artist]] of TRACKS.entries()) {
    const author = ids[i % 3];
    const track = await addTrack(db, {
      seasonId,
      author,
      day: 2 + i * 3,
      meta: { url: `https://example.com/track/${i + 1}`, title, author: artist },
    });
    if (i < 3) {
      await approveTrack(db, { id: track.id, seasonId, viewer: ids[(i + 1) % 3] }, at(3 + i * 3));
      await addTrackComment(db, {
        trackId: track.id,
        author: ids[(i + 2) % 3],
        body: "On repeat.",
      });
    }
  }

  await saveVersion(db, {
    seasonId,
    author: sam,
    day: 5,
    body: "We keep going, we keep it kind, and we keep it a little ridiculous.",
  });
  return { seeded: true };
}
