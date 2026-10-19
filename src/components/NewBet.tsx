"use client";
import { useState, useTransition } from "react";
import { proposeBetAction } from "@/actions/bets";
import { MemberPicker } from "@/components/MemberPicker";
import { useMembers } from "@/components/MembersProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import { type MemberId, othersOf } from "@/lib/members";
import { CLAIM_MAX, STAKES_MAX } from "@/lib/repo/bets";

export function NewBet({ me }: { me: MemberId }) {
  const others = othersOf(useMembers(), me);
  const [opponent, setOpponent] = useState<MemberId>(others[0]?.slug ?? "");
  const [open, setOpen] = useState(false);
  const [claim, setClaim] = useState("");
  const [stakes, setStakes] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <Button kind="primary" className="self-start" onClick={() => setOpen(true)}>
        {STRINGS.bets.cta}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown">{STRINGS.bets.cta}</h2>
          <MemberPicker
            options={others}
            value={opponent}
            onChange={setOpponent}
            label={STRINGS.pickers.betAgainst}
          />
          <Field
            placeholder={STRINGS.bets.claim}
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            maxLength={CLAIM_MAX}
            autoFocus
          />
          <Field
            placeholder={STRINGS.bets.stakes}
            value={stakes}
            onChange={(e) => setStakes(e.target.value)}
            maxLength={STAKES_MAX}
          />
          <Button
            kind="primary"
            disabled={
              pending || opponent === "" || claim.trim().length === 0 || stakes.trim().length === 0
            }
            onClick={() =>
              start(async () => {
                await proposeBetAction({ opponent, claim, stakes });
                setClaim("");
                setStakes("");
                setOpen(false);
              })
            }
          >
            {STRINGS.bets.add}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
