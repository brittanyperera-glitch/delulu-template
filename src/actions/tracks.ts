"use server";
import { revalidatePath } from "next/cache";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { createPost } from "@/lib/repo/posts";
import { addTrackComment } from "@/lib/repo/track-comments";
import { addTrack, approveTrack, trackUrlExists } from "@/lib/repo/tracks";
import { unfurl } from "@/lib/unfurl";

/** skinId present means the track also lands on the wall, as a link post under that skin. */
export async function addTrackAction(input: { url: string; skinId?: number }): Promise<void> {
  const { player, season, day } = await dayContext();
  const meta = await unfurl(input.url);
  // Check the dupe before writing anything: addTrack's own check is only a race backstop, so
  // running it after the wall post is created leaves that post orphaned once addTrack throws.
  if (await trackUrlExists(db(), season.id, meta.url))
    throw new Error("That track is already on the soundtrack");
  let postId: number | undefined;
  if (input.skinId) {
    const post = await createPost(db(), {
      seasonId: season.id,
      author: player,
      skinId: input.skinId,
      type: "link",
      linkMeta: meta,
      source: "track",
    });
    postId = post.id;
  }
  await addTrack(db(), { seasonId: season.id, author: player, day, meta, postId });
  revalidatePath("/soundtrack");
  revalidatePath("/");
}

/** The other person promotes a suggestion to The Soundtrack. */
export async function approveTrackAction(id: number): Promise<void> {
  const { player, season } = await dayContext();
  await approveTrack(db(), { id, seasonId: season.id, viewer: player }, new Date());
  revalidatePath("/soundtrack");
  revalidatePath("/");
}

/** parentId present makes this a reply, one level deep, to that top-level comment. */
export async function addTrackCommentAction(
  trackId: number,
  body: string,
  parentId?: number,
): Promise<void> {
  const { player } = await dayContext();
  await addTrackComment(db(), { trackId, author: player, body, parentId });
  revalidatePath("/soundtrack");
}
