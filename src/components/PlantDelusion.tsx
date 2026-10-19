"use client";
import { useState, useTransition } from "react";
import { plantDelusionAction } from "@/actions/delusions";
import { MemberPicker } from "@/components/MemberPicker";
import { useMembers } from "@/components/MembersProvider";
import { SkinPicker } from "@/components/SkinPicker";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { STRINGS } from "@/lib/content/strings";
import type { Skin } from "@/lib/db/schema";
import { type MemberId, memberList } from "@/lib/members";
import { DELUSION_MAX } from "@/lib/repo/delusions";

export function PlantDelusion({
  me,
  skins,
  initialSkinId,
}: {
  me: MemberId;
  skins: Skin[];
  initialSkinId: number | null;
}) {
  const members = useMembers();
  const [open, setOpen] = useState(false);
  const [about, setAbout] = useState<MemberId>(me);
  const [body, setBody] = useState("");
  // The skin is optional here, unlike a wall post: a line with no skin is a normal line.
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const [pending, start] = useTransition();
  return (
    <>
      <Button kind="primary" className="self-start" onClick={() => setOpen(true)}>
        {STRINGS.delusions.plant}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl text-brown">{STRINGS.delusions.plant}</h2>
          <MemberPicker
            options={memberList(members)}
            value={about}
            onChange={setAbout}
            label={STRINGS.delusions.whose}
          />
          <Field
            placeholder={STRINGS.delusions.placeholder}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={DELUSION_MAX}
            autoFocus
          />
          <span className="label text-muted">{STRINGS.delusions.skin}</span>
          <SkinPicker
            skins={skins}
            selectedId={skinId}
            onSelect={(id) => setSkinId(skinId === id ? null : id)}
          />
          <Button
            kind="primary"
            disabled={pending || body.trim().length === 0}
            onClick={() =>
              start(async () => {
                await plantDelusionAction({ about, body, skinId: skinId ?? undefined });
                setBody("");
                setOpen(false);
              })
            }
          >
            {STRINGS.delusions.add}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
