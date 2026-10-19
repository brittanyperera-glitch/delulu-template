import { TruthAnswerForm } from "@/components/TruthAnswerForm";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { TruthAnswer } from "@/lib/db/schema";
import { type MemberId, type MembersMap, memberList } from "@/lib/members";

export function Podiums({
  question,
  me,
  members,
  answers,
  open,
}: {
  question: string;
  me: MemberId;
  members: MembersMap;
  answers: TruthAnswer[];
  open: boolean;
}) {
  const answerOf = (p: MemberId) => answers.find((a) => a.author === p);
  return (
    <div className="flex flex-col gap-5">
      <Card tone="mustard" className="p-4">
        <p className="font-display text-2xl leading-tight text-brown">{question}</p>
      </Card>
      <div className="flex flex-col gap-3">
        {memberList(members).map(({ slug: p, name }) => {
          const a = answerOf(p);
          const visible = open || p === me;
          return (
            <div key={p} className="flex flex-col items-center gap-2">
              <Card tone="card" className="flex min-h-28 w-full items-center justify-center p-3">
                {a && visible ? (
                  <p className="font-body text-sm leading-snug text-ink break-words">{a.body}</p>
                ) : (
                  <span className="label text-muted">
                    {a ? STRINGS.truth.waiting : STRINGS.truth.empty}
                  </span>
                )}
              </Card>
              <Pill tone={a ? "avocado" : "cream"}>{name}</Pill>
            </div>
          );
        })}
      </div>
      <TruthAnswerForm draft={answerOf(me)?.body ?? null} locked={open} />
    </div>
  );
}
