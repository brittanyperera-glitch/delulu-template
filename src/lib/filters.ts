export const FILTERS = [
  { slug: "w", stamp: "W" },
  { slug: "l", stamp: "L" },
  { slug: "trululu", stamp: "TRULULU" },
] as const;

export type Filter =
  | { kind: "stamp"; stamp: (typeof FILTERS)[number]["stamp"] }
  | { kind: "skin"; id: number };

export function parseFilter(param: string): Filter | null {
  const f = FILTERS.find((x) => x.slug === param);
  if (f) return { kind: "stamp", stamp: f.stamp };
  const m = /^skin-(\d+)$/.exec(param);
  if (m) return { kind: "skin", id: Number(m[1]) };
  return null;
}
