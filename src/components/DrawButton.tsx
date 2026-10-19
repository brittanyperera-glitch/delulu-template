"use client";
import { useTransition } from "react";
import { drawAction } from "@/actions/jar";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { JarSize } from "@/lib/db/schema";

export function DrawButton({ size, count }: { size: JarSize; count: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || count === 0}
      onClick={() => start(() => drawAction(size))}
    >
      <Pill tone={count > 0 ? "mustard" : "cream"}>{`${STRINGS.jar.sizes[size]} ${count}`}</Pill>
    </button>
  );
}
