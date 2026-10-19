"use server";
import { revalidatePath } from "next/cache";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { postAndClaim } from "@/lib/repo/section-post";
import { addSpoiler, claimHappened, listSpoilers } from "@/lib/repo/spoilers";

export async function addSpoilerAction(input: {
  imageUrl: string;
  line?: string;
  skinId?: number;
}): Promise<void> {
  const { season } = await dayContext();
  await addSpoiler(db(), {
    seasonId: season.id,
    imageUrl: input.imageUrl,
    line: input.line,
    skinId: input.skinId,
  });
  revalidatePath("/spoilers");
}

/** The tile has no owner, so the post is authored by whoever tapped Happened. */
export async function happenedAction(input: { id: number; skinId: number }): Promise<void> {
  const { player, season, day } = await dayContext();
  const spoiler = (await listSpoilers(db(), season.id)).find((s) => s.id === input.id);
  if (!spoiler) throw new Error("No such spoiler");
  const post = await postAndClaim(
    db(),
    {
      seasonId: season.id,
      author: player,
      skinId: input.skinId,
      source: "spoiler",
      type: "photo",
      mediaUrl: spoiler.imageUrl,
      body: spoiler.line ?? undefined,
    },
    (postId) => claimHappened(db(), input.id, day, postId),
  );
  if (!post) throw new Error(STRINGS.sections.taken);
  revalidatePath("/spoilers");
  revalidatePath("/");
}
