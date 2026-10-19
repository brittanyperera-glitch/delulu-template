"use client";
import Link from "next/link";
import { useState } from "react";
import { AddTrack } from "@/components/AddTrack";
import { Mixtape } from "@/components/Mixtape";
import { RoomTitle } from "@/components/RoomHelp";
import { RoomsButton } from "@/components/RoomsButton";
import { Sleeve } from "@/components/Sleeve";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import type { Skin, Track } from "@/lib/db/schema";
import type { MemberId } from "@/lib/members";
import type { TrackCommentThread } from "@/lib/repo/track-comments";

type Tab = "mixtape" | "soundtrack";

/**
 * The soundtrack room, and the one room whose whole theme changes with the tab, so it renders
 * its own shell instead of the shared SectionPage (which is server-side and paints one fixed
 * paper). The Mixtape leads and turns the entire page dark, Spotify-style; the Soundtrack keeps
 * the retro rust of the vinyl records. Everything on the page (background, title, the add
 * button) themes together, not just the list.
 */
export function SoundtrackRoom({
  approved,
  allTracks,
  me,
  commentsByTrack = {},
  skins,
  initialSkinId,
}: {
  approved: Track[];
  allTracks: Track[];
  me: MemberId;
  commentsByTrack?: Record<number, TrackCommentThread[]>;
  skins: Skin[];
  initialSkinId: number | null;
}) {
  const [tab, setTab] = useState<Tab>("mixtape");
  const dark = tab === "mixtape";
  const ink = dark ? "text-mixtape-ink" : "text-cream";
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "mixtape", label: STRINGS.soundtrack.tabMixtape, count: allTracks.length },
    { id: "soundtrack", label: STRINGS.soundtrack.tabSoundtrack, count: approved.length },
  ];
  return (
    <div
      className={`min-h-dvh transition-colors duration-300 ${dark ? "bg-mixtape-bg" : "bg-rust"}`}
    >
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-5 pt-10 pb-24">
        <div className="flex flex-row items-center justify-between gap-3">
          <Link href="/" className="no-underline">
            <Pill tone="mustard">{STRINGS.wall.wall}</Pill>
          </Link>
          <RoomsButton tone="mustard" />
        </div>
        <RoomTitle
          title={STRINGS.nav.soundtrack}
          slug="soundtrack"
          display="font-display"
          ink={ink}
        />
        <AddTrack skins={skins} initialSkinId={initialSkinId} tone={dark ? "dark" : "paper"} />
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2" role="tablist" aria-label={STRINGS.nav.soundtrack}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                <Pill tone={tab === t.id ? "mustard" : "cream"}>
                  {t.label}
                  {t.count > 0 ? ` ${t.count}` : ""}
                </Pill>
              </button>
            ))}
          </div>
          <div role="tabpanel">
            {dark ? (
              <Mixtape tracks={allTracks} me={me} commentsByTrack={commentsByTrack} />
            ) : (
              <Sleeve tracks={approved} me={me} commentsByTrack={commentsByTrack} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
