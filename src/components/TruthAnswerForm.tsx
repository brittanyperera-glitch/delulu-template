"use client";
import { useState, useTransition } from "react";
import { answerTruthAction } from "@/actions/truth";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { STRINGS } from "@/lib/content/strings";
import { ANSWER_MAX } from "@/lib/repo/truth";

/**
 * Just the answer box, so the wall's tray and the Truth room can both offer it.
 *
 * It takes YOUR draft and a lock, never the answer rows. That is deliberate and it is a
 * privacy boundary, not a tidiness one: this is a client component, so anything handed to it
 * crosses into the page payload whether or not it is rendered. Passing both players' rows put
 * the other person's unanswered truth into the HTML of every wall load, which is exactly what
 * repo/truth.ts locks against server-side ("so nobody edits having read the other one").
 *
 * The day is never passed in either. answerTruthAction reads today from dayContext, because a
 * client-supplied day would let a future day be answered, and locked, early.
 */
export function TruthAnswerForm({
  draft: initial,
  locked,
}: {
  /** Your own answer so far, if you have one. Never theirs. */
  draft: string | null;
  /** Both answers are in, so nothing more can be edited. */
  locked: boolean;
}) {
  const [draft, setDraft] = useState(initial ?? "");
  const [pending, start] = useTransition();
  if (locked) return null;
  return (
    <div className="flex flex-col gap-3">
      <TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={ANSWER_MAX}
        placeholder={STRINGS.truth.placeholder}
        aria-label={STRINGS.truth.placeholder}
        className="min-h-24"
      />
      <Button
        kind="primary"
        disabled={pending || draft.trim().length === 0}
        onClick={() => start(() => answerTruthAction(draft))}
      >
        {STRINGS.truth.cta}
      </Button>
    </div>
  );
}
