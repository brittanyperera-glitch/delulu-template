import type { Paper } from "@/lib/db/schema";

/** A member's colour as a dot, using the paper token so it matches every other surface. */
export function Swatch({ colour, className = "" }: { colour: Paper; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-6 shrink-0 rounded-full border-2 border-brown ${className}`}
      style={{ background: `var(--color-${colour})` }}
    />
  );
}
