/**
 * Prophecies breaks the retro base for aged parchment, so its colours sit outside the
 * token set. They live here rather than in the page: a client component importing a
 * constant from a page module drags that page's whole server import chain, and therefore
 * next/headers, into the browser bundle, which fails the build.
 *
 * Darkened deliberately. The old page colour was #efe2c4, roughly 5% off the base cream
 * #f5ead8, so "themed" barely read as a different room at all. someone asked for a
 * different century, so the paper is now properly aged and the panel keeps its original
 * relationship to it, sitting a step darker so panels recede rather than float.
 */
export const PARCHMENT = {
  page: "bg-[#d9c49a]",
  panel: "bg-[#c9b083]",
  ink: "text-[#3a2c18]",
  rule: "border-[#a8906a]",
  wax: "bg-[#8c2f22]",
};
