"use client";
import { useState, useTransition } from "react";
import { armBombAction } from "@/actions/bombs";
import { MemberPicker } from "@/components/MemberPicker";
import { useMembers } from "@/components/MembersProvider";
import { SkinPicker } from "@/components/SkinPicker";
import { Field, TextArea } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import { TOTAL_DAYS } from "@/lib/days";
import { BOMB_EVENTS, type BombEvent, type Skin } from "@/lib/db/schema";
import { type MemberId, nameOf, othersOf } from "@/lib/members";
import { BOMB_MAX, type BombArmTrigger } from "@/lib/repo/bombs";
import { MANUAL_STAMPS } from "@/lib/repo/posts";
import { TERM } from "@/lib/terminal";

export function PlantBomb({
  skins,
  initialSkinId,
  day,
  sender,
}: {
  skins: Skin[];
  initialSkinId: number | null;
  day: number;
  sender: MemberId;
}) {
  const members = useMembers();
  const others = othersOf(members, sender);
  const [recipient, setRecipient] = useState<MemberId>(others[0]?.slug ?? "");
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<BombArmTrigger["kind"]>("day");
  const [when, setWhen] = useState(String(Math.min(day + 1, TOTAL_DAYS)));
  const [target, setTarget] = useState("10");
  const [stamp, setStamp] = useState<(typeof MANUAL_STAMPS)[number]>(MANUAL_STAMPS[0]);
  const [bombEvent, setBombEvent] = useState<BombEvent>(BOMB_EVENTS[0]);
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const [pending, start] = useTransition();
  const dayNum = Number(when);
  const targetNum = Number(target);
  const noTimeLeft = day >= TOTAL_DAYS;
  const recipientName = nameOf(members, recipient);
  const kindReady =
    kind === "day"
      ? dayNum > day && dayNum <= TOTAL_DAYS
      : kind === "count"
        ? Number.isFinite(targetNum) && targetNum > 0
        : true;
  const ready =
    !noTimeLeft && recipient !== "" && body.trim().length > 0 && skinId !== null && kindReady;
  const toggleClass = (active: boolean) =>
    `h-9 border-2 px-3 font-mono text-[11px] uppercase tracking-widest ${TERM.hair} ${
      active ? `${TERM.panel} ${TERM.green}` : `bg-transparent ${TERM.dim}`
    }`;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`h-12 self-start border-2 px-5 font-mono text-[11px] uppercase tracking-widest ${TERM.hair} ${TERM.panel} ${TERM.green}`}
      >
        {STRINGS.bombs.cta}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown">{STRINGS.bombs.cta}</h2>
          {noTimeLeft ? (
            <p className={`font-mono text-sm ${TERM.dim}`}>{STRINGS.bombs.noTime}</p>
          ) : (
            <>
              <MemberPicker
                options={others}
                value={recipient}
                onChange={setRecipient}
                label={STRINGS.bombs.to}
              />
              <TextArea
                placeholder={STRINGS.bombs.note}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={BOMB_MAX}
                className="font-mono"
              />
              <div className="flex flex-col gap-2">
                <p className="label text-muted">{STRINGS.bombs.trigger}</p>
                <div
                  className="flex flex-row flex-wrap gap-2"
                  role="radiogroup"
                  aria-label={STRINGS.bombs.trigger}
                >
                  <button
                    type="button"
                    aria-pressed={kind === "day"}
                    onClick={() => setKind("day")}
                    className={toggleClass(kind === "day")}
                  >
                    {STRINGS.bombs.onDay}
                  </button>
                  <button
                    type="button"
                    aria-pressed={kind === "count"}
                    onClick={() => setKind("count")}
                    className={toggleClass(kind === "count")}
                  >
                    {STRINGS.bombs.whenReaches(recipientName)}
                  </button>
                  <button
                    type="button"
                    aria-pressed={kind === "event"}
                    onClick={() => setKind("event")}
                    className={toggleClass(kind === "event")}
                  >
                    {STRINGS.bombs.nextTime(recipientName)}
                  </button>
                </div>
                {kind === "day" ? (
                  <Field
                    type="number"
                    inputMode="numeric"
                    min={day + 1}
                    max={TOTAL_DAYS}
                    placeholder={STRINGS.bombs.day}
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                  />
                ) : kind === "count" ? (
                  <div className="flex flex-col gap-2">
                    <Field
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-label={STRINGS.bombs.whenReaches(recipientName)}
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    />
                    <div
                      className="flex flex-row gap-2"
                      role="radiogroup"
                      aria-label={STRINGS.bombs.whenReaches(recipientName)}
                    >
                      {MANUAL_STAMPS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={stamp === s}
                          onClick={() => setStamp(s)}
                        >
                          <Pill tone={stamp === s ? "brown" : "cream"}>{STRINGS.stamps[s]}</Pill>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex flex-row flex-wrap gap-2"
                    role="radiogroup"
                    aria-label={STRINGS.bombs.nextTime(recipientName)}
                  >
                    {BOMB_EVENTS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        aria-pressed={bombEvent === e}
                        onClick={() => setBombEvent(e)}
                      >
                        <Pill tone={bombEvent === e ? "brown" : "cream"}>
                          {STRINGS.bombs.events[e]}
                        </Pill>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <SkinPicker skins={skins} selectedId={skinId} onSelect={setSkinId} />
              <p className="label text-muted">{STRINGS.bombs.noEdits}</p>
              <button
                type="button"
                disabled={pending || !ready}
                onClick={() =>
                  start(async () => {
                    if (skinId === null) return;
                    const trigger: BombArmTrigger =
                      kind === "day"
                        ? { kind: "day", detonateDay: dayNum }
                        : kind === "count"
                          ? { kind: "count", stamp, target: targetNum }
                          : { kind: "event", event: bombEvent };
                    await armBombAction({ recipient, body, skinId, trigger });
                    setBody("");
                    setOpen(false);
                  })
                }
                className={`h-12 border-2 px-5 font-mono text-[11px] uppercase tracking-widest disabled:opacity-40 ${TERM.hair} ${TERM.panel} ${TERM.green}`}
              >
                {STRINGS.bombs.arm}
              </button>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
