"use server";
import { revalidatePath } from "next/cache";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { armBomb, type BombArmTrigger, openBomb } from "@/lib/repo/bombs";

export async function armBombAction(input: {
  recipient: string;
  body: string;
  skinId: number;
  trigger: BombArmTrigger;
}): Promise<void> {
  const { player, season, day } = await dayContext();
  await armBomb(
    db(),
    {
      seasonId: season.id,
      sender: player,
      recipient: input.recipient,
      body: input.body,
      skinId: input.skinId,
      trigger: input.trigger,
    },
    day,
    new Date(),
  );
  revalidatePath("/bombs");
}

export async function openBombAction(id: number): Promise<void> {
  const { player, season } = await dayContext();
  await openBomb(db(), { id, seasonId: season.id, viewer: player }, new Date());
  revalidatePath("/bombs");
  revalidatePath("/");
}
