"use server";
import { revalidatePath } from "next/cache";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import type { Verdict } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";
import { addProphecy, judge } from "@/lib/repo/prophecies";

export async function addProphecyAction(input: { about: MemberId; body: string }): Promise<void> {
  const { player, season, day } = await dayContext();
  // The Day check lives in the repo, so a stale page cannot post past the seal.
  await addProphecy(
    db(),
    { seasonId: season.id, author: player, about: input.about, body: input.body },
    day,
  );
  revalidatePath("/prophecies");
}

export async function judgeProphecyAction(id: number, verdict: Verdict): Promise<void> {
  const { player, day } = await dayContext();
  await judge(db(), { id, by: player, verdict, day });
  revalidatePath("/prophecies");
  revalidatePath("/");
}
