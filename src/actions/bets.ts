"use server";
import { revalidatePath } from "next/cache";
import { STRINGS } from "@/lib/content/strings";
import { dayContext } from "@/lib/day-context";
import { db } from "@/lib/db/client";
import {
  acceptBet,
  betById,
  claimSettled,
  declineBet,
  proposeBet,
  receiptBody,
} from "@/lib/repo/bets";
import { postAndClaim } from "@/lib/repo/section-post";
import { getMembers } from "@/lib/session";

export async function proposeBetAction(input: {
  opponent: string;
  claim: string;
  stakes: string;
}): Promise<void> {
  const { player, season } = await dayContext();
  await proposeBet(db(), {
    seasonId: season.id,
    proposer: player,
    opponent: input.opponent,
    claim: input.claim,
    stakes: input.stakes,
  });
  revalidatePath("/bets");
}

export async function acceptBetAction(id: number): Promise<void> {
  const { player } = await dayContext();
  await acceptBet(db(), id, player);
  revalidatePath("/bets");
  revalidatePath("/");
}

export async function declineBetAction(id: number): Promise<void> {
  const { player } = await dayContext();
  await declineBet(db(), id, player);
  revalidatePath("/bets");
  revalidatePath("/");
}

export async function iLostAction(input: { id: number; skinId: number }): Promise<void> {
  const { player, season, day } = await dayContext();
  const bet = await betById(db(), input.id);
  if (!bet) throw new Error("No such bet");
  if (player !== bet.proposer && player !== bet.opponent)
    throw new Error("Only the two people in a bet can settle it");
  const members = await getMembers();
  const post = await postAndClaim(
    db(),
    {
      seasonId: season.id,
      author: player,
      skinId: input.skinId,
      source: "bet",
      type: "text",
      body: receiptBody(bet, player, members),
    },
    (postId) => claimSettled(db(), bet.id, player, postId, day),
  );
  if (!post) throw new Error(STRINGS.sections.taken);
  revalidatePath("/bets");
  revalidatePath("/");
}
