"use client";
import { useState, useTransition } from "react";
import { dealDareAction } from "@/actions/dares";
import { MemberPicker } from "@/components/MemberPicker";
import { useMembers } from "@/components/MembersProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import { type MemberId, othersOf } from "@/lib/members";
import { DARE_MAX, STAKE_MAX } from "@/lib/repo/dares";

export function DealDare({ me }: { me: MemberId }) {
  const others = othersOf(useMembers(), me);
  const [dared, setDared] = useState<MemberId>(others[0]?.slug ?? "");
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [stake, setStake] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <Button kind="primary" className="self-start" onClick={() => setOpen(true)}>
        {STRINGS.dares.cta}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown">{STRINGS.dares.cta}</h2>
          <MemberPicker
            options={others}
            value={dared}
            onChange={setDared}
            label={STRINGS.pickers.dareWho}
          />
          <Field
            placeholder={STRINGS.dares.placeholder}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={DARE_MAX}
            autoFocus
          />
          <Field
            placeholder={STRINGS.dares.stake}
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            maxLength={STAKE_MAX}
          />
          <Button
            kind="primary"
            disabled={pending || dared === "" || body.trim().length === 0}
            onClick={() =>
              start(async () => {
                await dealDareAction({ dared, body, stake: stake || undefined });
                setBody("");
                setStake("");
                setOpen(false);
              })
            }
          >
            {STRINGS.dares.add}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
