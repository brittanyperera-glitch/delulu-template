"use server";
import { revalidatePath } from "next/cache";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import type { MemberId } from "@/lib/members";
import { addDelusion, claimTrululu } from "@/lib/repo/delusions";
import { AUTO_STAMPS, addStamp, getPost } from "@/lib/repo/posts";
import { postAndClaim } from "@/lib/repo/section-post";

export async function plantDelusionAction(input: {
  about: MemberId;
  body: string;
  skinId?: number;
}): Promise<void> {
  const { player, season } = await dayContext();
  await addDelusion(db(), {
    seasonId: season.id,
    about: input.about,
    addedBy: player,
    body: input.body,
    skinId: input.skinId,
  });
  revalidatePath("/delusions");
}

export async function trululuAction(input: {
  id: number;
  postId?: number;
  skinId?: number;
  body?: string;
}): Promise<void> {
  const { player, season, day } = await dayContext();
  if (input.postId) {
    // The pill list can be stale (the other player may have deleted the post it offered), and
    // claimTrululu does not check deletedAt, so a claim against a dead post would flip the
    // delusion forever to a post nobody can see once the stamp that follows refuses it. Checking
    // liveness first keeps the flip from ever outliving a stamp that cannot succeed.
    const live = await getPost(db(), input.postId);
    if (!live) throw new Error(STRINGS.sections.taken);
    // Claim first: if the flip is already taken, nothing gets stamped.
    const claimed = await claimTrululu(db(), input.id, input.postId, day);
    if (claimed.length === 0) throw new Error(STRINGS.sections.taken);
    await addStamp(db(), input.postId, AUTO_STAMPS.delusion);
  } else {
    if (!input.skinId || !input.body?.trim()) throw new Error("Pick a post or write one");
    const post = await postAndClaim(
      db(),
      {
        seasonId: season.id,
        author: player,
        skinId: input.skinId,
        source: "delusion",
        type: "text",
        body: input.body,
      },
      (postId) => claimTrululu(db(), input.id, postId, day),
    );
    if (!post) throw new Error(STRINGS.sections.taken);
  }
  revalidatePath("/delusions");
  revalidatePath("/");
  revalidatePath("/wall/trululu");
}
