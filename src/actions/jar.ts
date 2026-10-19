"use server";
import { revalidatePath } from "next/cache";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import type { JarSize } from "@/lib/db/schema";
import { addJarItem, claimDone, drawFromJar, drawnFor, putBack } from "@/lib/repo/jar";
import { postAndClaim } from "@/lib/repo/section-post";

export async function addQuestAction(input: { body: string; size: JarSize }): Promise<void> {
  const { player, season } = await dayContext();
  await addJarItem(db(), {
    seasonId: season.id,
    author: player,
    body: input.body,
    size: input.size,
  });
  revalidatePath("/jar");
}

export async function drawAction(size: JarSize): Promise<void> {
  const { player, season } = await dayContext();
  await drawFromJar(db(), season.id, size, player);
  revalidatePath("/jar");
}

export async function putBackAction(id: number): Promise<void> {
  const { player } = await dayContext();
  await putBack(db(), id, player);
  revalidatePath("/jar");
}

export async function doneAction(input: { id: number; skinId: number }): Promise<void> {
  const { player, season, day } = await dayContext();
  const item = await drawnFor(db(), season.id, player);
  if (!item || item.id !== input.id) throw new Error("That quest is not in your hand");
  const post = await postAndClaim(
    db(),
    {
      seasonId: season.id,
      author: player,
      skinId: input.skinId,
      source: "jar",
      type: "text",
      body: item.body,
    },
    (postId) => claimDone(db(), item.id, postId, day),
  );
  if (!post) throw new Error(STRINGS.sections.taken);
  revalidatePath("/jar");
  revalidatePath("/");
}
