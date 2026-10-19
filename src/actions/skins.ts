"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import type { Paper, Pattern } from "@/lib/db/schema";
import { createSkin, updateSkin } from "@/lib/repo/skins";
import { requireSeason } from "@/lib/season";
import { getPlayer } from "@/lib/session";

export async function createSkinAction(input: {
  name: string;
  line?: string;
  portraitUrl?: string;
  paper?: Paper;
  pattern?: Pattern;
}) {
  const player = await getPlayer();
  const season = await requireSeason();
  const skin = await createSkin(db(), { seasonId: season.id, owner: player, ...input });
  revalidatePath("/");
  return skin;
}

export async function updateSkinAction(
  id: number,
  input: { name?: string; line?: string; paper?: Paper; pattern?: Pattern },
) {
  const player = await getPlayer();
  const skin = await updateSkin(db(), id, player, input);
  // The skin's name/paper appear in bylines on the wall and everywhere else it is joined at
  // render, not just on its own page.
  revalidatePath("/skins");
  revalidatePath("/");
  return skin;
}
