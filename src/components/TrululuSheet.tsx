"use client";
import { useState, useTransition } from "react";
import { trululuAction } from "@/actions/delusions";
import type { RecentPost } from "@/components/CreditsRoll";
import { SkinPicker } from "@/components/SkinPicker";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import type { Delusion, Skin } from "@/lib/db/schema";

export function TrululuSheet({
  delusion,
  onClose,
  skins,
  initialSkinId,
  recent,
}: {
  delusion: Delusion | null;
  onClose: () => void;
  skins: Skin[];
  initialSkinId: number | null;
  recent: RecentPost[];
}) {
  const [postId, setPostId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const [pending, start] = useTransition();
  const ready = postId !== null || (body.trim().length > 0 && skinId !== null);
  return (
    <Sheet open={delusion !== null} onClose={onClose}>
      {delusion ? (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown break-words">{delusion.body}</h2>
          <span className="label text-muted">{STRINGS.delusions.pick}</span>
          <div className="flex flex-row flex-wrap gap-2">
            {recent.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPostId(postId === p.id ? null : p.id)}
                aria-pressed={postId === p.id}
              >
                <Pill tone={postId === p.id ? "brown" : "cream"}>{`D${p.day} ${p.label}`}</Pill>
              </button>
            ))}
          </div>
          {postId === null ? (
            <>
              <Field
                placeholder={STRINGS.delusions.write}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
              />
              <SkinPicker skins={skins} selectedId={skinId} onSelect={setSkinId} />
            </>
          ) : null}
          <Button
            kind="primary"
            disabled={pending || !ready}
            onClick={() =>
              start(async () => {
                await trululuAction({
                  id: delusion.id,
                  postId: postId ?? undefined,
                  skinId: skinId ?? undefined,
                  body: body || undefined,
                });
                setPostId(null);
                setBody("");
                onClose();
              })
            }
          >
            {STRINGS.delusions.cta}
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
}
