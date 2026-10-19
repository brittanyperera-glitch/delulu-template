"use client";
import { useState, useTransition } from "react";
import { doneAction, putBackAction } from "@/actions/jar";
import { SkinPicker } from "@/components/SkinPicker";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { JarItem, Skin } from "@/lib/db/schema";

export function DrawnSlip({
  item,
  skins,
  initialSkinId,
}: {
  item: JarItem;
  skins: Skin[];
  initialSkinId: number | null;
}) {
  const [skinId, setSkinId] = useState<number | null>(initialSkinId);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-4 rounded-card border-[3px] border-brown bg-card p-4 shadow-hard -rotate-1">
      {/* The fold the slip arrived in. */}
      <div className="h-px w-full bg-brown/25" />
      <p className="font-display text-2xl leading-tight text-brown break-words">{item.body}</p>
      <div className="flex flex-row items-center gap-2">
        <Pill tone="mustard">{STRINGS.jar.sizes[item.size]}</Pill>
        {item.putBackCount > 0 ? (
          <Pill tone="cream">{STRINGS.jar.putBacks(item.putBackCount)}</Pill>
        ) : null}
      </div>
      <SkinPicker skins={skins} selectedId={skinId} onSelect={setSkinId} />
      <div className="flex flex-row gap-3">
        <Button
          kind="primary"
          disabled={pending || skinId === null}
          onClick={() =>
            start(async () => {
              if (skinId) await doneAction({ id: item.id, skinId });
            })
          }
        >
          {STRINGS.jar.done}
        </Button>
        <Button kind="ghost" disabled={pending} onClick={() => start(() => putBackAction(item.id))}>
          {STRINGS.jar.back}
        </Button>
      </div>
    </div>
  );
}
