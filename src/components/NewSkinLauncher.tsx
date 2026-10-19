"use client";
import { useState } from "react";
import { NewSkinSheet } from "@/components/NewSkinSheet";
import { Button } from "@/components/ui/Button";
import { STRINGS } from "@/lib/content/strings";

export function NewSkinLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button kind="ghost" className="self-start" onClick={() => setOpen(true)}>
        {STRINGS.skins.newSkin}
      </Button>
      <NewSkinSheet open={open} onClose={() => setOpen(false)} onSaved={() => setOpen(false)} />
    </>
  );
}
