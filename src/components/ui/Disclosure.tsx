import type { ReactNode } from "react";

/**
 * Native details/summary in the house style, matching the archive disclosure the Truth page
 * already uses. Native rather than JS state because a tray of these has to survive a server
 * re-render without losing which row was open, and because it needs no aria wiring.
 *
 * The headline is the whole point: a collapsed row has to carry enough to decide whether
 * opening it is worth a tap.
 */
export function Disclosure({
  headline,
  children,
  tone = "card",
  open = false,
}: {
  headline: ReactNode;
  children: ReactNode;
  /** Paper for the row. Tray rows use their section's colour. */
  tone?: string;
  open?: boolean;
}) {
  return (
    <details
      open={open}
      className={`group rounded-card border-[3px] border-brown shadow-hard-sm ${tone}`}
    >
      <summary className="flex cursor-pointer list-none flex-row items-center justify-between gap-3 p-3">
        {headline}
        <span
          aria-hidden="true"
          className="label shrink-0 text-brown transition-transform group-open:rotate-90"
        >
          &gt;
        </span>
      </summary>
      {/* Native details has no transition of its own, so the body eases in on reveal. */}
      <div className="reveal border-t-2 border-brown/20 p-3">{children}</div>
    </details>
  );
}
