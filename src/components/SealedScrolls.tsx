import { STRINGS } from "@/lib/content/strings";
import { type MembersMap, nameOf } from "@/lib/members";
import { PARCHMENT } from "@/lib/parchment";
import type { SealedScroll } from "@/lib/repo/prophecies";

/**
 * The other person's prophecies before Day 100: one rolled scroll each, a wax seal, and the
 * name of whoever wrote it. No way in. The body is never passed to this component (the repo
 * does not select it), so the words stay on the server until the day they open.
 */
export function SealedScrolls({
  scrolls,
  members,
}: {
  scrolls: SealedScroll[];
  members: MembersMap;
}) {
  if (scrolls.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <span className={`label ${PARCHMENT.ink}`}>{STRINGS.prophecies.theirs}</span>
      <ul className="flex flex-row flex-wrap gap-5">
        {scrolls.map((s) => (
          <li key={s.id} className="flex flex-col items-center gap-2">
            <svg width="76" height="48" viewBox="0 0 76 48" aria-hidden className="text-[#4a3a24]">
              <rect
                x="6"
                y="12"
                width="64"
                height="24"
                rx="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M6 12c-3 0-3 24 0 24M70 12c3 0 3 24 0 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="38" cy="24" r="6" fill="#5e1f16" />
            </svg>
            <span className={`label ${PARCHMENT.ink}`}>{nameOf(members, s.author)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
