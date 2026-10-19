/**
 * Time Bombs breaks the retro base for a dark classified terminal, so its colours sit outside
 * the token set. They live here rather than in a page or a client component: a client
 * component importing a constant from a page module drags that page's whole server import
 * chain, and therefore next/headers, into the browser bundle, which fails the build.
 * The fuse is the one token colour kept, because the spec calls a live fuse orange.
 */
export const TERM = {
  ground: "bg-[#0b0f0c]",
  panel: "bg-[#111a12]",
  hair: "border-[#24402a]",
  green: "text-[#7ce38b]",
  dim: "text-[#3f6f4a]",
  fuse: "bg-[#c67139]",
};
