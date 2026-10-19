"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { addComment, toggleReaction } from "@/lib/repo/reactions";
import { getPlayer } from "@/lib/session";

export async function toggleReactionAction(postId: number, word: string) {
  const player = await getPlayer();
  const r = await toggleReaction(db(), postId, player, word);
  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return r;
}

export async function addCommentAction(postId: number, body: string) {
  const player = await getPlayer();
  await addComment(db(), postId, player, body);
  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}
