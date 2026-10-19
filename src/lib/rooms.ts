import type { PillTone } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import { PARCHMENT } from "@/lib/parchment";
import { TERM } from "@/lib/terminal";

/**
 * The one registry of rooms: what each is called, which drawer group it sits in, and what
 * paper it is printed on. It replaces NAV_ITEMS and is the only place to look a room up.
 *
 * It lives in lib rather than in a page module for the reason parchment.ts and terminal.ts
 * already document: a client component importing a constant from a page module drags that
 * page's server import chain, and therefore next/headers, into the browser bundle and fails
 * the build.
 *
 * Labels come from STRINGS rather than being written here, so copy stays in one place. Note
 * the drawer wants "Time Bombs" (STRINGS.bombs.title), not the terser nav label.
 */
export type RoomGroup = "creed" | "play" | "future" | "style";

export type RoomTheme = {
  /** Paper for the full-width wrapper, so the window edges change too. */
  page: string;
  ink: string;
  /** The one colour that room uses for emphasis. */
  accent: string;
  /** How the room's title is set. Defaults to the app's display face. */
  display?: string;
  /** Extra classes for the page wrapper, for a room whose paper has an edge. */
  edge?: string;
  /**
   * The tone of the ROOMS control in this room. A dark paper needs a light pill: brown on
   * brown leaves the only way out of a room invisible.
   */
  pill?: PillTone;
};

export type Room = {
  slug: string;
  label: string;
  group: RoomGroup;
  theme: RoomTheme;
};

const BASE: RoomTheme = { page: "bg-cream", ink: "text-brown", accent: "text-orange" };

/**
 * Group order is the drawer's order. creed rooms are the promoted tier and lead the wall, but
 * they are also full rooms, so the drawer lists them too: a room you can only reach from one
 * small line under the manifesto is a room a reader cannot find.
 */
export const ROOMS: Room[] = [
  { slug: "manifesto", label: STRINGS.nav.manifesto, group: "creed", theme: BASE },
  { slug: "delusions", label: STRINGS.nav.delusions, group: "creed", theme: BASE },
  { slug: "spoilers", label: STRINGS.nav.spoilers, group: "creed", theme: BASE },

  // Hot: the things you do to each other.
  {
    slug: "dares",
    label: STRINGS.nav.dares,
    group: "play",
    theme: { page: "bg-orange", ink: "text-cream", accent: "text-mustard", pill: "cream" },
  },
  {
    slug: "bets",
    label: STRINGS.nav.bets,
    group: "play",
    theme: { page: "bg-mustard", ink: "text-brown", accent: "text-rust" },
  },
  {
    slug: "truth",
    label: STRINGS.nav.truth,
    group: "play",
    theme: { page: "bg-dust", ink: "text-brown", accent: "text-rust" },
  },
  {
    slug: "jar",
    label: STRINGS.nav.jar,
    group: "play",
    theme: { page: "bg-avocado", ink: "text-cream", accent: "text-mustard", pill: "cream" },
  },

  // Cold: the things that are sealed until later.
  {
    slug: "bombs",
    label: STRINGS.bombs.title,
    group: "future",
    theme: { page: TERM.ground, ink: TERM.green, accent: TERM.green, pill: "cream" },
  },
  {
    slug: "prophecies",
    label: STRINGS.nav.prophecies,
    group: "future",
    theme: {
      page: PARCHMENT.page,
      ink: PARCHMENT.ink,
      accent: "text-[#8c2f22]",
      // Not the app's face. A prophecy is typeset, not printed.
      display: "font-serif italic tracking-wide",
      edge: "deckle",
    },
  },
  {
    slug: "checkpoints",
    label: STRINGS.nav.checkpoints,
    group: "future",
    theme: { page: "bg-brown", ink: "text-cream", accent: "text-mustard", pill: "mustard" },
  },

  // Soft: how the run looks and sounds.
  {
    slug: "skins",
    label: STRINGS.nav.skins,
    group: "style",
    theme: { page: "bg-cream", ink: "text-brown", accent: "text-orange" },
  },
  {
    slug: "soundtrack",
    label: STRINGS.nav.soundtrack,
    group: "style",
    theme: { page: "bg-rust", ink: "text-cream", accent: "text-mustard", pill: "mustard" },
  },
];

/** Drawer order. creed leads: those three also live on the wall, but the drawer is the one
 *  place every room is reachable, so none is left out. */
export const DRAWER_GROUPS: { group: RoomGroup; label: string }[] = [
  { group: "creed", label: STRINGS.rooms.creed },
  { group: "play", label: STRINGS.rooms.play },
  { group: "future", label: STRINGS.rooms.future },
  { group: "style", label: STRINGS.rooms.style },
];

export function roomBySlug(slug: string): Room | undefined {
  return ROOMS.find((r) => r.slug === slug);
}

export function roomsIn(group: RoomGroup): Room[] {
  return ROOMS.filter((r) => r.group === group);
}

/** Falls back to the base paper so a room with no entry renders plainly, never broken. */
export function themeFor(slug: string): RoomTheme {
  return roomBySlug(slug)?.theme ?? BASE;
}
