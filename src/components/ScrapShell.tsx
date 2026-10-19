import type { ReactNode } from "react";
import { Card, type CardTone } from "@/components/ui/Card";
import type { Paper, Pattern, Post, Skin } from "@/lib/db/schema";

/**
 * The paper a scrap is stuck onto, and the object it is cut into.
 *
 * Two independent axes, both authored rather than derived, so no two adjacent scraps look
 * alike. The skin chooses the paper once and every post made as her inherits it, which is
 * what makes a run of posts read as a run of personas; a single scrap can override it.
 *
 * Before this, text posts were mustard and EVERY media post was near-white `card`, so a
 * photo-heavy day was a run of identical pale rectangles differing only by a small tilt.
 */
export function paperFor(post: Pick<Post, "paper" | "type">, skin: Pick<Skin, "paper">): CardTone {
  const chosen: Paper | null = post.paper ?? skin.paper;
  if (chosen) return chosen;
  // The old defaults, kept for a skin that has never picked: a note reads as a note.
  return post.type === "text" ? "mustard" : "card";
}

const PATTERN_CLASS: Record<Pattern, string> = {
  plain: "",
  grid: "pat-grid",
  torn: "pat-torn",
  tape: "pat-tape",
  dots: "pat-dots",
};

export function patternFor(skin: Pick<Skin, "pattern">): string {
  return skin.pattern ? PATTERN_CLASS[skin.pattern] : "";
}

/**
 * The frame. A photo becomes a polaroid, a link a torn ticket, a voice note a cassette, a
 * video a strip of film, and text stays a note. Type is already in the data, so this axis
 * costs no migration.
 */
export function ScrapShell({
  post,
  skin,
  tilt,
  children,
}: {
  post: Pick<Post, "paper" | "type">;
  skin: Pick<Skin, "paper" | "pattern">;
  tilt: number;
  children: ReactNode;
}) {
  const tone = paperFor(post, skin);
  const pattern = patternFor(skin);
  if (post.type === "photo") {
    // A polaroid is white whatever the skin's paper is, because that is what makes it a
    // polaroid. The deep bottom lip is the part you would have written on.
    return (
      <Card tone="card" tilt={tilt} className={`p-2 pb-7 ${pattern}`}>
        {children}
      </Card>
    );
  }
  if (post.type === "link") {
    return (
      <Card tone={tone} tilt={tilt} className={`relative flex flex-col gap-3 p-3 pl-5 ${pattern}`}>
        <span
          aria-hidden="true"
          className="ticket-edge pointer-events-none absolute inset-y-0 left-0 w-2 text-brown/30"
        />
        {children}
      </Card>
    );
  }
  if (post.type === "video") {
    return (
      <Card
        tone={tone}
        tilt={tilt}
        className={`filmstrip flex flex-col gap-3 px-4 py-3 ${pattern}`}
      >
        {children}
      </Card>
    );
  }
  if (post.type === "voice") {
    return (
      <Card tone={tone} tilt={tilt} className={`flex flex-col gap-3 p-3 ${pattern}`}>
        <span
          aria-hidden="true"
          className="flex flex-row items-center justify-center gap-8 pt-1 pb-2"
        >
          <span className="h-5 w-5 rounded-full border-[3px] border-brown" />
          <span className="h-5 w-5 rounded-full border-[3px] border-brown" />
        </span>
        {children}
      </Card>
    );
  }
  return (
    <Card tone={tone} tilt={tilt} className={`flex flex-col gap-3 p-3 ${pattern}`}>
      {children}
    </Card>
  );
}
