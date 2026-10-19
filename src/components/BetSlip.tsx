"use client";
import { useState, useTransition } from "react";
import { acceptBetAction, declineBetAction, iLostAction } from "@/actions/bets";
import { BeerMugs } from "@/components/BeerMugs";
import { useMembers } from "@/components/MembersProvider";
import { SkinPicker } from "@/components/SkinPicker";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Bet, Skin } from "@/lib/db/schema";
import { type MemberId, nameOf } from "@/lib/members";

const TONE = { proposed: "cream", open: "mustard", declined: "muted", settled: "rust" } as const;

export function BetSlip({
  bets,
  me,
  skins,
  initialSkinId,
}: {
  bets: Bet[];
  me: MemberId;
  skins: Skin[];
  initialSkinId: number | null;
}) {
  const members = useMembers();
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const [pending, start] = useTransition();
  return (
    // The trio sits centred and low-opacity behind the whole list (not per card), so it never
    // touches the opaque card text and still reads as the room's motif when there are no bets.
    <div className="relative min-h-[220px]">
      <BeerMugs className="pointer-events-none absolute inset-0 m-auto h-auto w-64 opacity-[0.08]" />
      <ul className="relative flex flex-col gap-6">
        {bets.map((b) => {
          const tone = TONE[b.status];
          return (
            <li
              key={b.id}
              className="relative rounded-card border-[3px] border-brown bg-card shadow-hard"
            >
              {/* Odds style: the claim large, the two names as the runners, the stakes as the price. */}
              <div className="flex flex-col gap-2 p-4">
                <div className="flex flex-row items-baseline justify-between gap-2">
                  <span className="label text-muted">{`${nameOf(members, b.proposer)} v ${nameOf(members, b.opponent)}`}</span>
                  {/* PillTone has no "muted" tone; TONE.declined is "muted" and falls back to cream.
                  Narrowed through a local const, since TS does not narrow an indexed access. */}
                  <Pill tone={tone === "muted" ? "cream" : tone}>
                    {STRINGS.bets.status[b.status]}
                  </Pill>
                </div>
                <p className="font-display text-xl leading-tight text-brown">{b.claim}</p>
                <span className="font-body text-sm text-ink">{`${STRINGS.bets.stakesAre} ${b.stakes}`}</span>
              </div>
              {/* The perforation, then the stub. */}
              <div className="border-t-2 border-dashed border-brown" />
              <div className="flex flex-row items-center justify-between gap-2 bg-surface px-4 py-3">
                {b.status === "settled" ? (
                  <>
                    <span className="label text-muted">{`${STRINGS.bets.paid} ${b.loser ? nameOf(members, b.loser) : ""}`}</span>
                    <span className="font-display -rotate-6 text-2xl text-rust">
                      {STRINGS.bets.settled}
                    </span>
                  </>
                ) : b.status === "proposed" && me === b.opponent ? (
                  <div className="flex flex-row gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => start(() => acceptBetAction(b.id))}
                    >
                      <Pill tone="avocado">{STRINGS.bets.accept}</Pill>
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => start(() => declineBetAction(b.id))}
                    >
                      <Pill tone="cream">{STRINGS.bets.decline}</Pill>
                    </button>
                  </div>
                ) : b.status === "open" ? (
                  <div className="flex w-full flex-col gap-3">
                    <SkinPicker skins={skins} selectedId={skinId} onSelect={setSkinId} />
                    <Button
                      kind="primary"
                      disabled={pending || skinId === null}
                      onClick={() =>
                        start(async () => {
                          if (skinId) await iLostAction({ id: b.id, skinId });
                        })
                      }
                    >
                      {STRINGS.bets.lost}
                    </Button>
                  </div>
                ) : (
                  <span className="label text-muted">{STRINGS.bets.status[b.status]}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
