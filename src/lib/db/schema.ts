import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const postTypeEnum = pgEnum("post_type", ["text", "photo", "link", "voice", "video"]);

export type LinkMeta = {
  url: string;
  title: string;
  image?: string;
  site?: string;
  /** oEmbed author_name: the artist for a music link, the channel for a video. */
  author?: string;
  provider?: "spotify" | "youtube" | "soundcloud" | "apple";
};

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

/**
 * The people using this deployment. The slug is what every other table stores and what the
 * session cookie carries, so it is restricted to cookie- and URL-safe characters.
 */
export const members = pgTable(
  "members",
  {
    slug: text("slug").primaryKey(),
    displayName: text("display_name").notNull(),
    colour: text("colour").$type<Paper>().notNull(),
    sortOrder: integer("sort_order").notNull(),
  },
  (t) => [
    check("members_slug_format", sql`${t.slug} ~ '^[a-z0-9-]{1,32}$'`),
    uniqueIndex("members_sort_order").on(t.sortOrder),
  ],
);

/** A column holding a member slug. Text plus a foreign key, so an unknown slug is refused. */
const member = (name: string) => text(name).references(() => members.slug);

export const seasons = pgTable(
  "seasons",
  {
    id: serial("id").primaryKey(),
    number: integer("number").notNull(),
    dayOne: date("day_one").notNull(),
    // IANA name. Day numbers roll over at midnight here, for every member alike.
    timezone: text("timezone").notNull().default("UTC"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  // The arbiter for starting the season. Both of them can tap Start at the same moment, and
  // two season rows would attach posts to whichever one won a later read.
  (t) => [uniqueIndex("seasons_number").on(t.number)],
);

/** A skin's paper is the colour every post made as her is stuck onto. */
export const PAPERS = [
  "cream",
  "mustard",
  "avocado",
  "orange",
  "rust",
  "butter",
  "rose",
  "sky",
  "peach",
  "lilac",
  "terracotta",
  "teal",
  "denim",
  "plum",
  "olive",
  "forest",
  "cocoa",
  "wine",
] as const;
export type Paper = (typeof PAPERS)[number];
export const PATTERNS = ["plain", "grid", "torn", "tape", "dots"] as const;
export type Pattern = (typeof PATTERNS)[number];

export const skins = pgTable("skins", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => seasons.id),
  owner: member("owner").notNull(),
  name: text("name").notNull(),
  portraitUrl: text("portrait_url"),
  line: text("line"),
  // Nullable with no default, like portraitUrl and line: skins already exist and a null
  // paper renders as the base card rather than as something broken.
  paper: text("paper").$type<Paper>(),
  pattern: text("pattern").$type<Pattern>(),
  createdAt: createdAt(),
});

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id),
    author: member("author").notNull(),
    day: integer("day").notNull(),
    skinId: integer("skin_id")
      .notNull()
      .references(() => skins.id),
    type: postTypeEnum("type").notNull(),
    body: text("body"),
    mediaUrl: text("media_url"),
    mediaSeconds: integer("media_seconds"),
    linkMeta: jsonb("link_meta").$type<LinkMeta>(),
    stamps: text("stamps").array().notNull().default(sql`'{}'::text[]`),
    // Overrides the skin's paper for this one scrap. Null means inherit.
    paper: text("paper").$type<Paper>(),
    source: text("source").notNull().default("manual"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    // Hidden is not deleted: the post leaves the wall but stays, and its author can bring it
    // back. Null means visible.
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
  },
  (t) => [index("posts_season_created").on(t.seasonId, t.createdAt)],
);

export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id),
    author: member("author").notNull(),
    word: text("word").notNull(),
  },
  (t) => [uniqueIndex("reactions_post_author_word").on(t.postId, t.author, t.word)],
);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id),
  author: member("author").notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
});

export const manifestoVersions = pgTable("manifesto_versions", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => seasons.id),
  body: text("body").notNull(),
  author: member("author").notNull(),
  day: integer("day").notNull(),
  createdAt: createdAt(),
});

export const jarSizeEnum = pgEnum("jar_size", ["tiny", "tonight", "weekend", "planning", "feral"]);
export const dareStatusEnum = pgEnum("dare_status", [
  "open",
  "accepted",
  "negotiating",
  "chickened",
  "done",
]);
// The spec's data model lists proposed/open/settled; its mechanics need a state for "declines".
export const betStatusEnum = pgEnum("bet_status", ["proposed", "open", "declined", "settled"]);
export const verdictEnum = pgEnum("verdict", ["fulfilled", "delulu"]);

export const delusions = pgTable("delusions", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => seasons.id),
  // One shared list: `about` is who the delusion is about, `addedBy` is who wrote it down.
  // Any member may add a line about any member, so these two differ freely.
  about: member("about").notNull(),
  addedBy: member("added_by").notNull(),
  body: text("body").notNull(),
  // A skin belongs to an entry, so a delusion about a marathon can carry the athlete skin.
  skinId: integer("skin_id").references(() => skins.id),
  trululuPostId: integer("trululu_post_id").references(() => posts.id),
  trululuDay: integer("trululu_day"),
  createdAt: createdAt(),
});

export const spoilers = pgTable("spoilers", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => seasons.id),
  imageUrl: text("image_url").notNull(),
  line: text("line"),
  // Optional, as on delusions: the image may be tagged with the skin it belongs to.
  skinId: integer("skin_id").references(() => skins.id),
  happenedDay: integer("happened_day"),
  postId: integer("post_id").references(() => posts.id),
  createdAt: createdAt(),
});

export const jarItems = pgTable(
  "jar_items",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id),
    author: member("author").notNull(),
    body: text("body").notNull(),
    size: jarSizeEnum("size").notNull(),
    putBackCount: integer("put_back_count").notNull().default(0),
    // A drawn slip is out of the jar until Done or Put Back, so two draws cannot land on it.
    drawnAt: timestamp("drawn_at", { withTimezone: true }),
    drawnBy: member("drawn_by"),
    donePostId: integer("done_post_id").references(() => posts.id),
    doneDay: integer("done_day"),
    createdAt: createdAt(),
  },
  (t) => [index("jar_items_season_size").on(t.seasonId, t.size)],
);

export const dares = pgTable(
  "dares",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id),
    darer: member("darer").notNull(),
    dared: member("dared").notNull(),
    body: text("body").notNull(),
    stake: text("stake"),
    status: dareStatusEnum("status").notNull().default("open"),
    counter: text("counter"),
    donePostId: integer("done_post_id").references(() => posts.id),
    doneDay: integer("done_day"),
    createdAt: createdAt(),
  },
  (t) => [check("dares_two_people", sql`${t.darer} <> ${t.dared}`)],
);

export const bets = pgTable(
  "bets",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id),
    proposer: member("proposer").notNull(),
    // The one member who may accept or decline. A bet is always between two people.
    opponent: member("opponent").notNull(),
    claim: text("claim").notNull(),
    stakes: text("stakes").notNull(),
    status: betStatusEnum("status").notNull().default("proposed"),
    loser: member("loser"),
    receiptPostId: integer("receipt_post_id").references(() => posts.id),
    settledDay: integer("settled_day"),
    createdAt: createdAt(),
  },
  (t) => [
    check("bets_two_people", sql`${t.proposer} <> ${t.opponent}`),
    check(
      "bets_loser_is_party",
      sql`${t.loser} is null or ${t.loser} in (${t.proposer}, ${t.opponent})`,
    ),
  ],
);

export const tracks = pgTable(
  "tracks",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id),
    author: member("author").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    artist: text("artist"),
    artUrl: text("art_url"),
    provider: text("provider"),
    day: integer("day").notNull().default(1),
    postId: integer("post_id").references(() => posts.id),
    createdAt: createdAt(),
    // Null means still a suggestion. Set together: approvedAt is the promotion moment,
    // approvedBy is who is allowed to set it (never the track's own author).
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: member("approved_by"),
  },
  // The duplicate check in addTrack reads then writes, so two simultaneous adds of one link
  // both pass it. This is what actually stops the second.
  (t) => [
    uniqueIndex("tracks_season_url").on(t.seasonId, t.url),
    check(
      "tracks_not_self_approved",
      sql`${t.approvedBy} is null or ${t.approvedBy} <> ${t.author}`,
    ),
  ],
);

export const trackComments = pgTable("track_comments", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id")
    .notNull()
    .references(() => tracks.id),
  author: member("author").notNull(),
  body: text("body").notNull(),
  // Null on a top-level comment. Set on a reply, pointing at the top-level comment it answers.
  // One level only: that is enforced by the component, not here, same as the schema not
  // policing skinId ownership elsewhere in this file.
  parentId: integer("parent_id").references((): AnyPgColumn => trackComments.id),
  createdAt: createdAt(),
});

export const bombTriggerEnum = pgEnum("bomb_trigger", ["day", "count", "event"]);

/** The events a bomb can wait on. Each is the moment a row of that kind is created. */
export const BOMB_EVENTS = ["jar_add", "dare_dealt", "prophecy_sealed", "post"] as const;
export type BombEvent = (typeof BOMB_EVENTS)[number];

/**
 * Per-kind trigger detail. `day` keeps its day in the detonateDay column and stores no
 * payload. `count` is an absolute target, so arming refuses when it is already met. `event`
 * carries the arming moment, because "the next time he adds to the jar" is meaningless
 * without one: every existing jar item would satisfy it.
 */
export type BombTrigger =
  | { kind: "count"; stamp: string; target: number }
  | { kind: "event"; event: BombEvent; after: string };

export const bombs = pgTable(
  "bombs",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id),
    sender: member("sender").notNull(),
    recipient: member("recipient").notNull(),
    body: text("body").notNull(),
    skinId: integer("skin_id")
      .notNull()
      .references(() => skins.id),
    // armedDay makes the fuse bar computable without reading a timestamp on the client.
    armedDay: integer("armed_day").notNull(),
    // Set for kind "day" only. Null for count and event bombs, which have no fixed date.
    detonateDay: integer("detonate_day"),
    triggerKind: bombTriggerEnum("trigger_kind").notNull().default("day"),
    triggerPayload: jsonb("trigger_payload").$type<BombTrigger>(),
    postId: integer("post_id").references(() => posts.id),
    createdAt: createdAt(),
  },
  (t) => [
    index("bombs_season_day").on(t.seasonId, t.detonateDay),
    check("bombs_two_people", sql`${t.sender} <> ${t.recipient}`),
  ],
);

export const prophecies = pgTable("prophecies", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => seasons.id),
  author: member("author").notNull(),
  about: member("about").notNull(),
  body: text("body").notNull(),
  day: integer("day").notNull().default(1),
  verdict: verdictEnum("verdict"),
  verdictDay: integer("verdict_day"),
  createdAt: createdAt(),
});

export const truthAnswers = pgTable(
  "truth_answers",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id),
    day: integer("day").notNull(),
    author: member("author").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("truth_answers_season_day_author").on(t.seasonId, t.day, t.author)],
);

export type Recap = {
  from: number;
  to: number;
  posts: number;
  trululus: number;
  ws: number;
  ls: number;
  skinsUsed: number;
  topPostId: number | null;
};

export const checkpoints = pgTable(
  "checkpoints",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasons.id),
    day: integer("day").notNull(),
    // Null until the day is opened: the rollover flags the day, the page builds the recap.
    recapJson: jsonb("recap_json").$type<Recap>(),
    jarItemId: integer("jar_item_id").references(() => jarItems.id),
    postId: integer("post_id").references(() => posts.id),
    openedBy: member("opened_by"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("checkpoints_season_day").on(t.seasonId, t.day)],
);

export type MemberRow = typeof members.$inferSelect;
export type Season = typeof seasons.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Skin = typeof skins.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type ManifestoVersion = typeof manifestoVersions.$inferSelect;
export type Delusion = typeof delusions.$inferSelect;
export type Spoiler = typeof spoilers.$inferSelect;
export type JarItem = typeof jarItems.$inferSelect;
export type JarSize = (typeof jarSizeEnum.enumValues)[number];
export type Dare = typeof dares.$inferSelect;
export type DareStatus = (typeof dareStatusEnum.enumValues)[number];
export type Bet = typeof bets.$inferSelect;
export type BetStatus = (typeof betStatusEnum.enumValues)[number];
export type Track = typeof tracks.$inferSelect;
export type TrackComment = typeof trackComments.$inferSelect;
export type Bomb = typeof bombs.$inferSelect;
export type Prophecy = typeof prophecies.$inferSelect;
export type Verdict = (typeof verdictEnum.enumValues)[number];
export type TruthAnswer = typeof truthAnswers.$inferSelect;
export type Checkpoint = typeof checkpoints.$inferSelect;
