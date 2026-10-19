"use server";
import { revalidatePath } from "next/cache";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { saveVersion } from "@/lib/manifesto";

export async function saveManifestoAction(body: string): Promise<void> {
  const { player, season, day } = await dayContext();
  await saveVersion(db(), { seasonId: season.id, author: player, day, body });
  revalidatePath("/manifesto");
  revalidatePath("/");
}
