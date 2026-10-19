import type { Post } from "@/lib/db/schema";
import { type MembersMap, nameOf } from "@/lib/members";

function mmss(s: number | null): string {
  const n = Math.max(0, Math.round(s ?? 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

/**
 * interactive=false is the wall: no anchors (a link inside a link fights the outer one), and
 * video keeps its static placeholder there. Voice is the exception: real controls play on the
 * wall too, with clicks on them kept from reaching the outer Link (see the handlers below).
 */
export function ScrapMedia({
  post,
  members,
  large = false,
  interactive = false,
}: {
  post: Post;
  members: MembersMap;
  large?: boolean;
  interactive?: boolean;
}) {
  const frame = "rounded-[10px] border-2 border-brown overflow-hidden bg-cream";
  if (post.type === "photo" && post.mediaUrl) {
    // Plain img: Blob URLs are remote and unoptimised on purpose (no next/image domain config to maintain).
    return (
      // biome-ignore lint/performance/noImgElement: a remote Blob URL, deliberately unoptimised
      <img
        src={post.mediaUrl}
        alt={post.body ?? `${nameOf(members, post.author)}, day ${post.day}`}
        className={`${frame} w-full ${large ? "" : "max-h-[420px] object-cover"}`}
      />
    );
  }
  if (post.type === "video" && post.mediaUrl) {
    if (!interactive) {
      return (
        <div className={`${frame} relative aspect-video bg-brown/10`}>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-12 w-12 rounded-full bg-orange border-[3px] border-brown" />
          </span>
          <span className="label absolute bottom-2 right-2 rounded-full bg-brown px-2 py-0.5 text-cream">
            {mmss(post.mediaSeconds)}
          </span>
        </div>
      );
    }
    return (
      // biome-ignore lint/a11y/useMediaCaption: a private two-person site, no caption track to ship
      <video
        src={post.mediaUrl}
        controls
        playsInline
        preload="metadata"
        className={`${frame} w-full`}
      />
    );
  }
  if (post.type === "voice" && post.mediaUrl) {
    return (
      <div className={`${frame} flex items-center gap-3 p-3`}>
        {/* biome-ignore lint/a11y/useMediaCaption: a private two-person site, no caption track to ship */}
        <audio
          src={post.mediaUrl}
          controls
          preload="metadata"
          className="w-full"
          // The wall wraps the whole scrap in a Link. stopPropagation alone keeps this
          // click off the Link's own handler, but the anchor's native "follow href" default
          // action reads defaultPrevented, not propagation, so both are needed or a real
          // browser still navigates on top of the audio.
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <span className="label text-muted">{mmss(post.mediaSeconds)}</span>
      </div>
    );
  }
  if (post.type === "link" && post.linkMeta) {
    const m = post.linkMeta;
    const inner = (
      <>
        {/* biome-ignore lint/performance/noImgElement: a remote thumbnail from the linked site, deliberately unoptimised */}
        {m.image ? <img src={m.image} alt="" className="w-full aspect-video object-cover" /> : null}
        <div className="p-3 flex flex-col gap-1">
          <span className="font-body font-bold text-brown leading-snug">{m.title}</span>
          {m.site ? <span className="label text-muted">{m.site}</span> : null}
        </div>
      </>
    );
    return interactive ? (
      <a href={m.url} target="_blank" rel="noreferrer" className={`${frame} block`}>
        {inner}
      </a>
    ) : (
      <div className={`${frame} block`}>{inner}</div>
    );
  }
  return null;
}
