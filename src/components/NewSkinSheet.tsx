"use client";
import { useState, useTransition } from "react";
import { createSkinAction, updateSkinAction } from "@/actions/skins";
import { patternFor } from "@/components/ScrapShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import { PAPERS, PATTERNS, type Paper, type Pattern, type Skin } from "@/lib/db/schema";

/**
 * Inventing a skin now picks her paper too, once, and everything posted as her inherits it.
 * That is what makes a run of posts read as a run of personas rather than a stack of
 * identical rectangles, and it is why the choice lives here rather than on every post.
 *
 * Passing `skin` switches this to edit mode: fields start filled from it and the submit
 * updates it in place, everywhere it is already joined (posted scraps included), rather than
 * creating a new one.
 */
export function NewSkinSheet({
  open,
  onClose,
  onSaved,
  skin,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (skin: Skin) => void;
  skin?: Skin;
}) {
  const [name, setName] = useState(skin?.name ?? "");
  const [line, setLine] = useState(skin?.line ?? "");
  const [paper, setPaper] = useState<Paper>(skin?.paper ?? "cream");
  const [pattern, setPattern] = useState<Pattern>(skin?.pattern ?? "plain");
  const [pending, start] = useTransition();
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-2xl text-brown">
          {skin ? STRINGS.skins.edit : STRINGS.composer.newSkin}
        </h2>
        <Field
          placeholder={STRINGS.skins.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
        />
        <Field
          placeholder={STRINGS.skins.linePlaceholder}
          value={line}
          onChange={(e) => setLine(e.target.value)}
          maxLength={80}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="label text-brown">{STRINGS.paperPicker.paper}</legend>
          <div className="flex flex-row flex-wrap gap-2">
            {PAPERS.map((p) => (
              <button key={p} type="button" onClick={() => setPaper(p)} aria-pressed={paper === p}>
                <Pill tone={p} className={paper === p ? "ring-2 ring-brown ring-offset-2" : ""}>
                  {STRINGS.papers[p]}
                </Pill>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="label text-brown">{STRINGS.paperPicker.pattern}</legend>
          <div className="flex flex-row flex-wrap gap-2">
            {PATTERNS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPattern(p)}
                aria-pressed={pattern === p}
              >
                <Pill
                  tone="cream"
                  className={pattern === p ? "ring-2 ring-brown ring-offset-2" : ""}
                >
                  {STRINGS.patterns[p]}
                </Pill>
              </button>
            ))}
          </div>
        </fieldset>
        {/* The choice shown as the thing itself, so you pick a look rather than a word. */}
        <Card tone={paper} className={`p-3 ${patternFor({ pattern })}`}>
          <span className="font-body font-bold">
            {name.trim() || STRINGS.skins.namePlaceholder}
          </span>
        </Card>
        <Button
          kind="primary"
          disabled={pending || name.trim().length === 0}
          onClick={() =>
            start(async () => {
              const saved = skin
                ? await updateSkinAction(skin.id, { name, line: line || undefined, paper, pattern })
                : await createSkinAction({ name, line: line || undefined, paper, pattern });
              if (!skin) {
                setName("");
                setLine("");
              }
              onSaved(saved);
            })
          }
        >
          {skin ? STRINGS.post.save : STRINGS.skins.add}
        </Button>
      </div>
    </Sheet>
  );
}
