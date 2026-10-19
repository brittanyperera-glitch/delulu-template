"use server";
import { revalidatePath } from "next/cache";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { openCheckpoint } from "@/lib/repo/checkpoints";

export async function openCheckpointAction(id: number): Promise<void> {
  const { player, season } = await dayContext();
  await openCheckpoint(db(), season.id, id, player);
  revalidatePath("/checkpoints");
  revalidatePath("/");
}
