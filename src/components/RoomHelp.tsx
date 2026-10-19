import { STRINGS } from "@/lib/content/strings";

/**
 * A room's title, with a question mark that says what the room is for.
 *
 * The details wraps the WHOLE title row rather than sitting beside it, for two reasons: the
 * explanation then spans the column instead of being indented under the mark, and tapping the
 * title works as well as tapping the mark, which is what a confused person reaches for first.
 *
 * Native, so it is collapsed by default, costs no JS, and survives a server re-render. A room
 * with nothing to explain renders a plain heading rather than an empty control.
 */
export function RoomTitle({
  title,
  slug,
  display,
  ink,
}: {
  title: string;
  slug: string;
  display: string;
  ink: string;
}) {
  const text = STRINGS.help[slug];
  const heading = <h1 className={`${display} text-[34px] leading-none ${ink}`}>{title}</h1>;
  if (!text) return heading;
  return (
    <details className="group">
      {/* The label goes on the summary, which is the control. A bare span has no role that
          supports naming, and the mark itself is decorative once the summary is named. */}
      <summary
        aria-label={STRINGS.help.label}
        className="flex cursor-pointer list-none flex-row items-center gap-3"
      >
        {heading}
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-current text-[13px] font-bold ${ink} opacity-50 group-open:opacity-100`}
        >
          ?
        </span>
      </summary>
      <p className={`font-body mt-3 max-w-[46ch] text-sm leading-snug ${ink} opacity-80`}>{text}</p>
    </details>
  );
}
