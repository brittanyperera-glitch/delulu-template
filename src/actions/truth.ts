"use server";
import { revalidatePath } from "next/cache";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import { memberIds } from "@/lib/members";
import { answer } from "@/lib/repo/truth";
import { getMembers } from "@/lib/session";

// day is never taken from the caller: a client-supplied day would let /truth?day=100 be
// answered, and locked, long before its turn. Today's day always comes from dayContext.
export async function answerTruthAction(body: string): Promise<void> {
  const { player, season, day } = await dayContext();
  const ids = memberIds(await getMembers());
  await answer(db(), { seasonId: season.id, day, author: player, body }, ids, day);
  revalidatePath("/truth");
  revalidatePath("/");
}
