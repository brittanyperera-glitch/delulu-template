"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import type { LinkMeta, Paper, Post } from "@/lib/db/schema";
import { createPost, deletePost, editPost, setHidden } from "@/lib/repo/posts";
import { requireSeason } from "@/lib/season";
import { getPlayer } from "@/lib/session";

export type ComposerInput = {
  skinId: number;
  type: Post["type"];
  body?: string;
  mediaUrl?: string;
  mediaSeconds?: number;
  linkMeta?: LinkMeta;
  stamps?: string[];
  /** Overrides the skin's paper for this one scrap. Absent means inherit. */
  paper?: Paper;
};

export async function createPostAction(input: ComposerInput): Promise<{ id: number }> {
  const player = await getPlayer();
  const season = await requireSeason();
  const post = await createPost(db(), { seasonId: season.id, author: player, ...input });
  revalidatePath("/");
  return { id: post.id };
}

export async function editPostAction(
  id: number,
  input: { body: string; media?: { url: string; type: Post["type"]; seconds?: number } },
): Promise<void> {
  const player = await getPlayer();
  await editPost(db(), id, player, input);
  revalidatePath("/");
  revalidatePath(`/post/${id}`);
}

export async function deletePostAction(id: number): Promise<void> {
  const player = await getPlayer();
  await deletePost(db(), id, player);
  revalidatePath("/");
}

export async function hidePostAction(id: number, hidden: boolean): Promise<void> {
  const player = await getPlayer();
  await setHidden(db(), id, player, hidden);
  revalidatePath("/");
  revalidatePath(`/post/${id}`);
}
