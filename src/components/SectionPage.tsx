import Link from "next/link";
import type { ReactNode } from "react";
import { RoomTitle } from "@/components/RoomHelp";
import { RoomsButton } from "@/components/RoomsButton";
import { Pill } from "@/components/ui/Pill";
import { STRINGS } from "@/lib/content/strings";
import { themeFor } from "@/lib/rooms";

/**
 * Every section page is this: the way out, the title, and the section.
 *
 * TWO ways out, deliberately. The thirteen-pill nav this replaced had the Wall as its FIRST
 * item, and dropping it left rooms you could enter and not leave: the drawer lists the other
 * nine rooms and the wall was in none of them. So the Wall is one tap on the left, and the
 * drawer is on the right for going sideways.
 *
 * The paper comes from the room registry keyed on the slug, so a room is themed by being
 * registered rather than by every page remembering to pass colours. bg and ink remain as
 * overrides for a room that wants something the registry cannot express.
 */
export function SectionPage({
  title,
  slug,
  bg,
  ink,
  children,
}: {
  title: string;
  slug: string;
  /** Overrides the registry. Only for a room whose look is more than paper and ink. */
  bg?: string;
  ink?: string;
  children: ReactNode;
}) {
  const theme = themeFor(slug);
  const paint = ink ?? theme.ink;
  return (
    // The paper colour goes on the full-width wrapper, the content in a centred phone-width
    // column. Put the colour on the column instead and the window edges keep the default
    // paper, which reads as a rendering fault rather than a different room.
    <div className={`min-h-dvh ${bg ?? theme.page} ${theme.edge ?? ""}`}>
      <main className="px-5 pt-10 pb-24 flex flex-col gap-6 mx-auto w-full max-w-[480px]">
        <div className="flex flex-row items-center justify-between gap-3">
          <Link href="/" className="no-underline">
            <Pill tone={theme.pill ?? "brown"}>{STRINGS.wall.wall}</Pill>
          </Link>
          <RoomsButton tone={theme.pill} />
        </div>
        <RoomTitle
          title={title}
          slug={slug}
          display={theme.display ?? "font-display"}
          ink={paint}
        />
        {children}
      </main>
    </div>
  );
}
