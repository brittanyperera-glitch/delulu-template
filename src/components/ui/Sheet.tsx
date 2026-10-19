"use client";
import { type ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";

export function Sheet({
  open,
  onClose,
  title,
  side = "bottom",
  children,
}: {
  open: boolean;
  onClose: () => void;
  /**
   * Renders as the sheet's heading AND becomes its accessible name. Optional because the
   * twelve existing call sites supply their own h2; passing both would show two headings.
   * aria-labelledby is set only when this is given, since pointing it at an absent id
   * leaves the dialog with no accessible name at all, which is worse than omitting it.
   */
  title?: string;
  /**
   * Where the panel sits. "bottom" is the phone-native sheet everywhere. "left" keeps that
   * on a phone but becomes a full-height left sidebar on a laptop, which is what the rooms
   * want: a hideable side rail rather than a sheet that covers the wall you came from.
   */
  side?: "bottom" | "left";
  children: ReactNode;
}) {
  const id = useId();
  const bottom =
    "absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[30px] border-t-[3px] border-brown bg-card p-5 pb-8";
  const panel =
    side === "left"
      ? `${bottom} lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-[380px] lg:max-w-[85vw] lg:max-h-none lg:rounded-t-none lg:rounded-r-[28px] lg:border-t-0 lg:border-r-[3px] lg:pb-6`
      : bottom;
  // A sheet you cannot dismiss from the keyboard is a trap, and the scrim is the only other
  // way out. Registered while open only, so a closed sheet does not eat the key.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Rendered into the body, not in place: the sheet is mounted deep inside the sticky wall
  // rail, whose stacking context let the wall's tilted cards paint over a fixed z-40 sheet.
  // A portal makes it a true top-level overlay so nothing on the page can sit above it.
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      {...(title ? { "aria-labelledby": id } : {})}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-brown/30"
        onClick={onClose}
      />
      <div className={panel}>
        <div
          className={`mx-auto mb-4 h-1 w-9 rounded-full bg-brown/30 ${side === "left" ? "lg:hidden" : ""}`}
        />
        {title ? (
          <h2 id={id} className="font-display mb-4 text-2xl text-brown">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
