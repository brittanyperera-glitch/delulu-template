import type { Post, Skin, Track, TrackComment } from "@/lib/db/schema";
import { TEST_MEMBERS } from "@/lib/db/test-members";
import { type Member, type MembersMap, toMembersMap } from "@/lib/members";

/**
 * Row builders for the component tests, which render against literals rather than a database.
 *
 * These exist because a hand-written literal has to be edited in every test file every time a
 * column is added, and the compiler only tells you AFTER you have added the column. Adding
 * `skins.paper` broke five fixtures across four files at once. Typed as the real row, so a new
 * column fails HERE, in one place, and every caller keeps working.
 *
 * Defaults mirror what the database actually gives a fresh row: nullable decoration columns
 * are null, not absent and not a plausible-looking value.
 */
const [ALEX, SAM, JO] = TEST_MEMBERS;

/** The same three people createTestDb inserts, as the provider-side Member shape. */
export function memberRow(over: Partial<Member> = {}): Member {
  return { slug: ALEX.slug, name: ALEX.displayName, colour: ALEX.colour, sortOrder: 0, ...over };
}

export const TEST_MEMBERS_MAP: MembersMap = toMembersMap(
  [ALEX, SAM, JO].map((m) =>
    memberRow({ slug: m.slug, name: m.displayName, colour: m.colour, sortOrder: m.sortOrder }),
  ),
);

export function skinRow(over: Partial<Skin> = {}): Skin {
  return {
    id: 1,
    seasonId: 1,
    owner: ALEX.slug,
    name: "CEO Alex",
    portraitUrl: null,
    line: null,
    paper: null,
    pattern: null,
    createdAt: new Date(),
    ...over,
  };
}

export function postRow(over: Partial<Post> = {}): Post {
  return {
    id: 1,
    seasonId: 1,
    author: ALEX.slug,
    day: 7,
    skinId: 1,
    type: "text",
    body: "not a metaphor",
    mediaUrl: null,
    mediaSeconds: null,
    linkMeta: null,
    stamps: [],
    paper: null,
    source: "manual",
    createdAt: new Date(),
    updatedAt: null,
    deletedAt: null,
    hiddenAt: null,
    ...over,
  };
}

export function trackRow(over: Partial<Track> = {}): Track {
  return {
    id: 1,
    seasonId: 1,
    author: ALEX.slug,
    url: "https://open.spotify.com/track/a",
    title: "So Back",
    artist: null,
    artUrl: null,
    provider: null,
    day: 1,
    postId: null,
    createdAt: new Date(),
    approvedAt: null,
    approvedBy: null,
    ...over,
  };
}

export function trackCommentRow(over: Partial<TrackComment> = {}): TrackComment {
  return {
    id: 1,
    trackId: 1,
    author: ALEX.slug,
    body: "love this one",
    parentId: null,
    createdAt: new Date(),
    ...over,
  };
}
