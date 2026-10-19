"use client";
import { useState, useTransition } from "react";
import { addQuestAction } from "@/actions/jar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import type { JarSize } from "@/lib/db/schema";
import { JAR_SIZES, QUEST_MAX } from "@/lib/repo/jar";

export function AddQuest({ size }: { size?: JarSize }) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<JarSize>(size ?? "tiny");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <Button kind="ghost" className="self-start" onClick={() => setOpen(true)}>
        {STRINGS.jar.add}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown">{STRINGS.jar.add}</h2>
          <Field
            placeholder={STRINGS.jar.placeholder}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={QUEST_MAX}
            autoFocus
          />
          <div
            className="flex flex-row flex-wrap gap-2"
            role="radiogroup"
            aria-label={STRINGS.jar.size}
          >
            {JAR_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setChosen(s)}
                aria-pressed={chosen === s}
              >
                <Pill tone={chosen === s ? "brown" : "cream"}>{STRINGS.jar.sizes[s]}</Pill>
              </button>
            ))}
          </div>
          <Button
            kind="primary"
            disabled={pending || body.trim().length === 0}
            onClick={() =>
              start(async () => {
                await addQuestAction({ body, size: chosen });
                setBody("");
                setOpen(false);
              })
            }
          >
            {STRINGS.jar.put}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
