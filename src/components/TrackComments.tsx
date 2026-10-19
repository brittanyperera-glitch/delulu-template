"use client";
import { useRef, useState, useTransition } from "react";
import { addTrackCommentAction } from "@/actions/tracks";
import { useMembers } from "@/components/MembersProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { STRINGS } from "@/lib/content/strings";
import type { TrackComment } from "@/lib/db/schema";
import { type MemberId, nameOf } from "@/lib/members";
import type { TrackCommentThread } from "@/lib/repo/track-comments";

/** paper is the retro default (the vinyl shelf); dark is the Spotify-style Mixtape tab. */
export type CommentTone = "paper" | "dark";

const BUBBLE = {
  // paper "me" carries no text colour, matching the original: it inherits body ink (#201e1d).
  paper: {
    me: "self-end bg-card border-brown",
    them: "self-start bg-avocado text-cream border-brown",
  },
  dark: {
    me: "self-end bg-mixtape-card text-mixtape-ink border-mixtape-line",
    them: "self-start bg-mixtape-them text-mixtape-ink border-mixtape-line",
  },
} as const;

const MUTED = { paper: "text-muted", dark: "text-mixtape-muted" } as const;

function CommentBubble({
  comment,
  me,
  tone,
}: {
  comment: TrackComment;
  me: MemberId;
  tone: CommentTone;
}) {
  const members = useMembers();
  return (
    <div
      className={`max-w-[85%] rounded-card border-[3px] px-4 py-3 ${BUBBLE[tone][comment.author === me ? "me" : "them"]}`}
    >
      <p className="font-body font-bold leading-snug break-words">{comment.body}</p>
      <span className="label opacity-80">{nameOf(members, comment.author)}</span>
    </div>
  );
}

function ReplyForm({
  trackId,
  parentId,
  tone,
  onDone,
}: {
  trackId: number;
  parentId: number;
  tone: CommentTone;
  onDone: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-row gap-2 pl-4"
      onSubmit={(e) => {
        e.preventDefault();
        const body = ref.current?.value ?? "";
        if (!body.trim()) return;
        start(async () => {
          await addTrackCommentAction(trackId, body, parentId);
          onDone();
        });
      }}
    >
      <Field
        ref={ref}
        tone={tone}
        placeholder={STRINGS.trackComments.replyPlaceholder}
        maxLength={280}
      />
      <Button kind="primary" tone={tone} type="submit" disabled={pending}>
        {STRINGS.trackComments.reply}
      </Button>
    </form>
  );
}

/** The soundtrack's comment thread: one level of replies, mirroring Comments.tsx's shape. */
export function TrackComments({
  trackId,
  comments,
  me,
  tone = "paper",
}: {
  trackId: number;
  comments: TrackCommentThread[];
  me: MemberId;
  tone?: CommentTone;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {comments.length === 0 ? (
        <p className={`font-body ${MUTED[tone]}`}>{STRINGS.trackComments.none}</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <CommentBubble comment={c} me={me} tone={tone} />
            {c.replies.map((r) => (
              <div key={r.id} className="pl-4">
                <CommentBubble comment={r} me={me} tone={tone} />
              </div>
            ))}
            {replyingTo === c.id ? (
              <ReplyForm
                trackId={trackId}
                parentId={c.id}
                tone={tone}
                onDone={() => setReplyingTo(null)}
              />
            ) : (
              <button
                type="button"
                className={`label self-start pl-4 ${MUTED[tone]}`}
                onClick={() => setReplyingTo(c.id)}
              >
                {STRINGS.trackComments.reply}
              </button>
            )}
          </div>
        ))
      )}
      <form
        className="flex flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = ref.current?.value ?? "";
          if (!body.trim()) return;
          start(async () => {
            await addTrackCommentAction(trackId, body);
            if (ref.current) ref.current.value = "";
          });
        }}
      >
        <Field
          ref={ref}
          tone={tone}
          placeholder={STRINGS.trackComments.placeholder}
          maxLength={280}
        />
        <Button kind="primary" tone={tone} type="submit" disabled={pending}>
          {STRINGS.trackComments.send}
        </Button>
      </form>
    </div>
  );
}
