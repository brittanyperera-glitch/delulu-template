"use client";
import { useState, useTransition } from "react";
import {
  acceptDareAction,
  chickenOutAction,
  doneDareAction,
  resolveNegotiationAction,
} from "@/actions/dares";
import { CounterSheet } from "@/components/CounterSheet";
import { useMembers } from "@/components/MembersProvider";
import { SkinPicker } from "@/components/SkinPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Dare, Skin } from "@/lib/db/schema";
import { type MemberId, nameOf } from "@/lib/members";
import { tiltFor } from "@/lib/repo/posts";

const TONE = {
  open: "cream",
  accepted: "avocado",
  negotiating: "mustard",
  chickened: "rust",
  done: "orange",
} as const;

/** One whole dare, list or no list, so the wall can offer a single dare inline. */
export function DareCard({
  dare,
  me,
  skins,
  initialSkinId,
}: {
  dare: Dare;
  me: MemberId;
  skins: Skin[];
  initialSkinId: number | null;
}) {
  const members = useMembers();
  // A dare aimed at me and still open arrives face down, the way a card is dealt.
  const [flipped, setFlipped] = useState(false);
  const [pending, start] = useTransition();
  // The status pill is this dare's stamp. It slams only on the card that was just acted on,
  // never on a render, so yesterday's DONE does not thump every time the wall is opened.
  const [acted, setActed] = useState(false);
  const act = (fn: () => Promise<void>) => {
    setActed(true);
    // Return the promise, do not discard it: start() holds `pending` only for as long as
    // the promise it is given is unresolved, so voiding it would clear the disabled state
    // immediately and let both buttons be tapped twice.
    start(() => fn());
  };
  const [countering, setCountering] = useState(false);
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const mine = dare.dared === me;
  const faceDown = mine && dare.status === "open" && !flipped;
  return (
    <>
      <Card
        tone={faceDown ? "avocado" : "card"}
        // From the id, not a list position: a card rendered alone would always get the same angle.
        tilt={tiltFor(dare)}
        className="flex flex-col gap-3 p-4"
      >
        {faceDown ? (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="flex flex-col items-center gap-3 py-6"
          >
            {/* aria-hidden: the button's accessible name is the Pill's "Flip it", not this decorative line. */}
            <span aria-hidden="true" className="font-display text-2xl text-cream">
              {STRINGS.dares.dealt(nameOf(members, dare.darer))}
            </span>
            <Pill tone="cream">{STRINGS.dares.reveal}</Pill>
          </button>
        ) : (
          <>
            <p className="font-display text-xl leading-tight text-brown break-words">{dare.body}</p>
            {dare.stake ? (
              <span className="label text-muted">{STRINGS.dares.stakeIs(dare.stake)}</span>
            ) : null}
            {dare.counter ? (
              <p className="font-body text-sm text-ink">{STRINGS.dares.counterIs(dare.counter)}</p>
            ) : null}
            <div className="flex flex-row items-center justify-between gap-2 border-t-2 border-brown/25 pt-3">
              <span className="label text-avocado">{nameOf(members, dare.darer)}</span>
              <Pill tone={TONE[dare.status]} className={acted ? "slam" : ""}>
                {STRINGS.dares.status[dare.status]}
              </Pill>
            </div>
            {mine && (dare.status === "open" || dare.status === "negotiating") ? (
              <div className="flex flex-row flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act(() => acceptDareAction(dare.id))}
                >
                  <Pill tone="avocado">{STRINGS.dares.accept}</Pill>
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act(() => chickenOutAction(dare.id))}
                >
                  <Pill tone="rust">{STRINGS.dares.chicken}</Pill>
                </button>
                {dare.status === "open" ? (
                  <button type="button" disabled={pending} onClick={() => setCountering(true)}>
                    <Pill tone="mustard">{STRINGS.dares.negotiate}</Pill>
                  </button>
                ) : null}
              </div>
            ) : null}
            {dare.status === "negotiating" && dare.darer === me ? (
              <div className="flex flex-row flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act(() => resolveNegotiationAction(dare.id, true))}
                >
                  <Pill tone="avocado">{STRINGS.dares.take}</Pill>
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => act(() => resolveNegotiationAction(dare.id, false))}
                >
                  <Pill tone="cream">{STRINGS.dares.decline}</Pill>
                </button>
              </div>
            ) : null}
            {dare.status === "accepted" && mine ? (
              <div className="flex flex-col gap-3">
                <SkinPicker skins={skins} selectedId={skinId} onSelect={setSkinId} />
                <Button
                  kind="primary"
                  disabled={pending || skinId === null}
                  onClick={() =>
                    start(async () => {
                      if (skinId) await doneDareAction({ id: dare.id, skinId });
                    })
                  }
                >
                  {STRINGS.dares.done}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>
      <CounterSheet dare={countering ? dare : null} onClose={() => setCountering(false)} />
    </>
  );
}
