"use client";
import { useState, useTransition } from "react";
import { negotiateAction } from "@/actions/dares";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import type { Dare } from "@/lib/db/schema";
import { DARE_MAX } from "@/lib/repo/dares";

export function CounterSheet({ dare, onClose }: { dare: Dare | null; onClose: () => void }) {
  const [counter, setCounter] = useState("");
  const [pending, start] = useTransition();
  return (
    <Sheet open={dare !== null} onClose={onClose}>
      {dare ? (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown break-words">{dare.body}</h2>
          <Field
            placeholder={STRINGS.dares.counterPlaceholder}
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
            maxLength={DARE_MAX}
            autoFocus
          />
          <Button
            kind="primary"
            disabled={pending || counter.trim().length === 0}
            onClick={() =>
              start(async () => {
                await negotiateAction({ id: dare.id, counter });
                setCounter("");
                onClose();
              })
            }
          >
            {STRINGS.dares.send}
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
}
