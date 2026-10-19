"use client";
import { useState, useTransition } from "react";
import { saveManifestoAction } from "@/actions/manifesto";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { STRINGS } from "@/lib/content/strings";
import { MANIFESTO_MAX } from "@/lib/manifesto";

export function ManifestoEditor({ body, spent }: { body: string; spent: boolean }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(body);
  const [pending, start] = useTransition();
  if (!open) {
    if (spent) return <p className="label self-start text-muted">{STRINGS.manifesto.spent}</p>;
    return (
      <Button kind="ghost" className="self-start" onClick={() => setOpen(true)}>
        {STRINGS.manifesto.edit}
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MANIFESTO_MAX}
        className="font-mono min-h-64 leading-[28px]"
        aria-label={STRINGS.nav.manifesto}
      />
      <div className="flex flex-row gap-3">
        <Button
          kind="primary"
          disabled={pending || draft.trim().length === 0}
          onClick={() =>
            start(async () => {
              await saveManifestoAction(draft);
              setOpen(false);
            })
          }
        >
          {STRINGS.manifesto.save}
        </Button>
        <Button
          kind="ghost"
          onClick={() => {
            setDraft(body);
            setOpen(false);
          }}
        >
          {STRINGS.post.cancel}
        </Button>
      </div>
    </div>
  );
}
