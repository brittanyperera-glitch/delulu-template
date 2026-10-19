"use client";
import { useState, useTransition } from "react";
import { judgeProphecyAction } from "@/actions/prophecies";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Verdict } from "@/lib/db/schema";

const OPTIONS: Verdict[] = ["fulfilled", "delulu"];

export function ProphecyVerdict({
  id,
  verdict,
  mine,
}: {
  id: number;
  verdict: Verdict | null;
  mine: boolean;
}) {
  const [pending, start] = useTransition();
  // Which one was just tapped, so the wax cracks on that pill only and only on the tap.
  // Deriving it from `verdict` instead would replay the crack on every later page load.
  const [cracked, setCracked] = useState<Verdict | null>(null);
  return (
    <div className="flex flex-row gap-2 pt-2">
      {OPTIONS.map((v) => {
        const label = STRINGS.prophecies.verdicts[v];
        if (!mine)
          return verdict === v ? (
            <Pill key={v} tone={v === "fulfilled" ? "avocado" : "mustard"}>
              {label}
            </Pill>
          ) : null;
        return (
          <button
            key={v}
            type="button"
            disabled={pending}
            onClick={() => {
              setCracked(v);
              start(() => judgeProphecyAction(id, v));
            }}
            aria-pressed={verdict === v}
          >
            <Pill
              tone={verdict === v ? (v === "fulfilled" ? "avocado" : "mustard") : "cream"}
              className={cracked === v ? "crack" : ""}
            >
              {label}
            </Pill>
          </button>
        );
      })}
    </div>
  );
}
