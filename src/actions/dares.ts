"use server";
import { revalidatePath } from "next/cache";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import {
  acceptDare,
  chickenOut,
  claimDareDone,
  dareById,
  negotiateDare,
  proposeDare,
  resolveNegotiation,
} from "@/lib/repo/dares";
import { postAndClaim } from "@/lib/repo/section-post";

export async function dealDareAction(input: {
  dared: string;
  body: string;
  stake?: string;
}): Promise<void> {
  const { player, season } = await dayContext();
  await proposeDare(db(), {
    seasonId: season.id,
    darer: player,
    dared: input.dared,
    body: input.body,
    stake: input.stake,
  });
  revalidatePath("/dares");
}

export async function acceptDareAction(id: number): Promise<void> {
  const { player } = await dayContext();
  await acceptDare(db(), id, player);
  revalidatePath("/dares");
  revalidatePath("/");
}

export async function chickenOutAction(id: number): Promise<void> {
  const { player } = await dayContext();
  await chickenOut(db(), id, player);
  revalidatePath("/dares");
  revalidatePath("/");
}

export async function negotiateAction(input: { id: number; counter: string }): Promise<void> {
  const { player } = await dayContext();
  await negotiateDare(db(), input.id, player, input.counter);
  revalidatePath("/dares");
  revalidatePath("/");
}

export async function resolveNegotiationAction(id: number, accept: boolean): Promise<void> {
  const { player } = await dayContext();
  await resolveNegotiation(db(), id, player, accept);
  revalidatePath("/dares");
  revalidatePath("/");
}

export async function doneDareAction(input: { id: number; skinId: number }): Promise<void> {
  const { player, season, day } = await dayContext();
  const dare = await dareById(db(), input.id);
  if (!dare || dare.dared !== player) throw new Error("Only the dared person can finish it");
  const post = await postAndClaim(
    db(),
    {
      seasonId: season.id,
      author: player,
      skinId: input.skinId,
      source: "dare",
      type: "text",
      body: dare.body,
    },
    (postId) => claimDareDone(db(), dare.id, postId, day),
  );
  if (!post) throw new Error(STRINGS.sections.taken);
  revalidatePath("/dares");
  revalidatePath("/");
}
