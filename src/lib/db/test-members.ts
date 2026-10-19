import type { members } from "./schema";

/**
 * The people every test database starts with. Its own file so component tests can import it
 * without pulling PGlite in. Three, not two, so a test cannot pass by assuming "the other
 * one" is unique.
 */
export const TEST_MEMBERS = [
  { slug: "alex", displayName: "Alex", colour: "mustard", sortOrder: 0 },
  { slug: "sam", displayName: "Sam", colour: "sky", sortOrder: 1 },
  { slug: "jo", displayName: "Jo", colour: "rose", sortOrder: 2 },
] as const satisfies readonly (typeof members.$inferInsert)[];
