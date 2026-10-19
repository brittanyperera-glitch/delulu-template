"use client";
import { useActionState, useEffect, useState } from "react";
import { type SetupState, setupAction } from "@/actions/season";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SITE } from "@/config/site";
import { localDate } from "@/lib/days";
import type { Paper } from "@/lib/db/schema";
import { MAX_MEMBERS, MIN_MEMBERS } from "@/lib/members";
import { SETUP } from "./copy";
import { dayOneRange } from "./range";
import { Swatch } from "./Swatch";

type Row = { id: number; name: string; colour: Paper };

const selectClass =
  "h-12 min-w-0 flex-1 rounded-xl border-2 border-brown bg-card px-3 font-body text-base text-brown outline-none focus:border-orange";

/** Bounds are plain strings so this client file never imports the database schema. */
export function SetupForm({
  papers,
  zones,
}: {
  papers: readonly Paper[];
  zones: readonly string[];
}) {
  const [state, action, pending] = useActionState<SetupState, FormData>(setupAction, {});
  const [rows, setRows] = useState<Row[]>(() =>
    [0, 1].map((i) => ({ id: i, name: "", colour: papers[i % papers.length] })),
  );
  const [nextId, setNextId] = useState(2);
  const [zone, setZone] = useState<string>(SITE.defaultTimezone);
  const [picked, setPicked] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  // Browser values only exist after mount, so the server render stays neutral.
  useEffect(() => {
    setNow(new Date());
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zones.includes(browser)) setZone(browser);
  }, [zones]);

  const range = now ? dayOneRange(now, zone) : null;
  const today = now ? localDate(now, zone) : "";

  const update = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="label mb-2 text-muted">{SETUP.people}</legend>
        {rows.map((r, i) => (
          <div key={r.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Field
                name="name"
                value={r.name}
                onChange={(e) => update(r.id, { name: e.target.value })}
                placeholder={SETUP.namePlaceholder}
                aria-label={`${SETUP.namePlaceholder} ${i + 1}`}
                maxLength={24}
                autoComplete="off"
                className="min-w-0 flex-1"
              />
              {rows.length > MIN_MEMBERS && (
                <button
                  type="button"
                  className="label h-12 shrink-0 px-2 text-muted"
                  onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                >
                  {SETUP.remove}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Swatch colour={r.colour} />
              <select
                name="colour"
                value={r.colour}
                onChange={(e) => update(r.id, { colour: e.target.value as Paper })}
                aria-label={`${SETUP.colourLabel} ${i + 1}`}
                className={selectClass}
              >
                {papers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {rows.length < MAX_MEMBERS && (
          <Button
            kind="ghost"
            type="button"
            onClick={() => {
              setRows((rs) => [
                ...rs,
                { id: nextId, name: "", colour: papers[rs.length % papers.length] },
              ]);
              setNextId(nextId + 1);
            }}
          >
            {SETUP.add}
          </Button>
        )}
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="label text-muted">{SETUP.timezone}</span>
        <select
          name="timezone"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className={`${selectClass} w-full flex-none`}
        >
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <label htmlFor="day-one" className="label text-muted">
          {SETUP.firstDay}
        </label>
        <Field
          id="day-one"
          name="dayOne"
          type="date"
          required
          value={picked ?? today}
          min={range?.min}
          max={range?.max}
          onChange={(e) => setPicked(e.target.value)}
        />
      </div>

      {state.error && (
        <p role="alert" className="font-body text-sm text-rust">
          {state.error}
        </p>
      )}
      <Button kind="primary" type="submit" disabled={pending || !today}>
        {pending ? SETUP.saving : SETUP.cta}
      </Button>
    </form>
  );
}
