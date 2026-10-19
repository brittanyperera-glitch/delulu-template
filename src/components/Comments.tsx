"use client";
import { useRef, useTransition } from "react";
import { addCommentAction } from "@/actions/reactions";
import { useMembers } from "@/components/MembersProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { STRINGS } from "@/lib/content/strings";
import type { Comment } from "@/lib/db/schema";
import { type MemberId, nameOf } from "@/lib/members";

export function Comments({
  postId,
  comments,
  me,
}: {
  postId: number;
  comments: Comment[];
  me: MemberId;
}) {
  const members = useMembers();
  const ref = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) => (
        <div
          key={c.id}
          className={`max-w-[85%] rounded-card border-[3px] border-brown px-4 py-3 ${c.author === me ? "self-end bg-card" : "self-start bg-avocado text-cream"}`}
        >
          <p className="font-body font-bold leading-snug break-words">{c.body}</p>
          <span className="label opacity-80">{nameOf(members, c.author)}</span>
        </div>
      ))}
      <form
        className="flex flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = ref.current?.value ?? "";
          if (!body.trim()) return;
          start(async () => {
            await addCommentAction(postId, body);
            if (ref.current) ref.current.value = "";
          });
        }}
      >
        <Field ref={ref} placeholder={STRINGS.comments.placeholder} maxLength={280} />
        <Button kind="primary" type="submit" disabled={pending}>
          {STRINGS.comments.send}
        </Button>
      </form>
    </div>
  );
}
