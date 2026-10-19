import Link from "next/link";
import { notFound } from "next/navigation";
import { Comments } from "@/components/Comments";
import { OwnerControls } from "@/components/OwnerControls";
import { Reactions } from "@/components/Reactions";
import { Scrap } from "@/components/Scrap";
import { STRINGS } from "@/lib/content/strings";
import { db } from "@/lib/db/client";
import { getPost } from "@/lib/repo/posts";
import { getMembers, getPlayer } from "@/lib/session";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const player = await getPlayer();
  const members = await getMembers();
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const item = await getPost(db(), n);
  if (!item) notFound();
  return (
    <main className="min-h-dvh px-5 pt-8 pb-16 flex flex-col gap-6 max-w-2xl mx-auto">
      <Link href="/" className="label text-brown">
        &larr; {STRINGS.nav.wall}
      </Link>
      <Scrap item={item} me={player} members={members} large />
      <Reactions postId={item.post.id} reactions={item.reactions} me={player} />
      <Comments postId={item.post.id} comments={item.comments} me={player} />
      {item.post.author === player ? <OwnerControls post={item.post} /> : null}
    </main>
  );
}
