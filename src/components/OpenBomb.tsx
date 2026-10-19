"use client";
import { useState, useTransition } from "react";
import { openBombAction } from "@/actions/bombs";
import { STRINGS } from "@/lib/content/strings";
import { TERM } from "@/lib/terminal";

/**
 * The only piece of Terminal that needs the browser: everything else renders on the server.
 * Kept as its own file rather than a client Terminal, since Terminal's server import chain
 * (dayContext, next/headers) would otherwise ship into the bundle.
 *
 * Opening is the payoff, so it behaves like a terminal rather than showing a spinner: the
 * panel flashes and the line types itself out while the write is in flight. The animation is
 * on the transition, not on render, so a page load never replays somebody else's detonation.
 */
export function OpenBomb({ id }: { id: number }) {
  const [pending, start] = useTransition();
  const [firing, setFiring] = useState(false);
  if (firing || pending) {
    return (
      <span
        className={`flash-term flex flex-row items-center gap-2 font-mono text-[11px] uppercase tracking-widest ${TERM.green}`}
      >
        <span className="type-out">{STRINGS.bombs.gone}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setFiring(true);
        start(() => openBombAction(id));
      }}
      className={`h-7 border-2 px-3 font-mono text-[11px] uppercase tracking-widest disabled:opacity-40 ${TERM.hair} ${TERM.panel} ${TERM.green}`}
    >
      {STRINGS.bombs.open}
    </button>
  );
}
