"use client";
import { STRINGS } from "@/lib/content/strings";

export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={STRINGS.home.add}
      className="fixed bottom-5 right-5 z-30 h-[58px] w-[58px] rounded-full bg-orange border-[3px] border-brown shadow-hard text-cream font-display text-3xl leading-none flex items-center justify-center"
    >
      +
    </button>
  );
}
