"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { STRINGS } from "@/lib/content/strings";

const COLLAPSED_KEY = "scrapbook:creed-collapsed";

/** Shown until the effect below can check the real value, matching what a first-ever visit gets. */
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * The manifesto in full, which was asked for after seeing one sentence of it in
 * a plain cream box: "the manifesto needs to be open in full".
 *
 * It is the most characterful writing in the app, so it is the wall's anchor rather than a
 * quotation. Set in the display face on ruled paper and tilted, so it reads as something
 * written and stuck down rather than as body copy.
 *
 * The creed body itself is hideable per viewer ("manifesto should be hideable via toggle or
 * drawer"); rejected `ui/Disclosure` because it has no localStorage persistence by design (its
 * own docstring: state must survive a server re-render, the opposite of what we want here) and
 * its summary row stays visible even when open, which would pin a second "Manifesto" line above
 * the creed instead of replacing it. A plain useState toggle fits better.
 *
 * Delusions and Spoilers hang off the bottom with a live count each and are never hidden by
 * this toggle: these three are the promoted tier and this block is the whole of their presence
 * on the wall, which is also why the Spoilers line is the only place a HAPPENED count appears
 * anywhere.
 */
export function CreedBlock({
  body,
  delusions,
  trululu,
  spoilers,
  happened,
}: {
  body: string;
  delusions: number;
  trululu: number;
  spoilers: number;
  happened: number;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Deferred to an effect so the server-rendered markup (always "shown") matches the client's
  // first render; only after that does a stored "collapsed" choice take over.
  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Per-viewer convenience only; nothing downstream needs this write to succeed.
      }
      return next;
    });
  }

  return (
    <Card tone="card" tilt={-1} className="pat-grid flex flex-col gap-4 p-5">
      {collapsed ? (
        <div className="flex flex-row items-center justify-between gap-3">
          <span className="label text-brown">{STRINGS.nav.manifesto}</span>
          <button type="button" className="label text-muted" onClick={toggle}>
            {STRINGS.manifesto.show}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Link href="/manifesto" className="no-underline">
            <p className="font-display whitespace-pre-line text-xl leading-snug text-brown">
              {body}
            </p>
          </Link>
          <button type="button" className="label self-end text-muted" onClick={toggle}>
            {STRINGS.manifesto.hide}
          </button>
        </div>
      )}
      <div className="flex flex-col">
        <Link
          href="/delusions"
          className="label flex flex-row items-center justify-between gap-3 border-t-2 border-brown/15 py-2 text-brown no-underline"
        >
          <span>{STRINGS.wall.delusionsLine(delusions, trululu)}</span>
          <span aria-hidden="true">&gt;</span>
        </Link>
        <Link
          href="/spoilers"
          className="label flex flex-row items-center justify-between gap-3 border-t-2 border-brown/15 py-2 text-brown no-underline"
        >
          <span>{STRINGS.wall.spoilersLine(spoilers, happened)}</span>
          <span aria-hidden="true">&gt;</span>
        </Link>
      </div>
    </Card>
  );
}
