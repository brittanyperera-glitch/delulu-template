/** One retro stein: body, foam cap, handle and a glass highlight, matching JarGlass's outline style. */
function Mug({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d="M56 46c18-3 18 27 0 24"
        fill="none"
        stroke="#402310"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect
        x="14"
        y="34"
        width="42"
        height="54"
        rx="6"
        fill="#e0a526"
        stroke="#402310"
        strokeWidth="3"
      />
      <path d="M22 44v34" stroke="#f9f4ed" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
      <path
        d="M12,36 C9,27 13,18 20,21 C22,12 32,10 36,17 C39,9 50,10 52,18 C59,15 63,23 60,30 C63,35 59,39 54,36 L16,36 C11,39 9,41 12,36 Z"
        fill="#ebddc5"
        stroke="#402310"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="44" cy="17" r="2.3" fill="#f9f4ed" opacity="0.85" />
      <circle cx="25" cy="16" r="2" fill="#f9f4ed" opacity="0.8" />
      <circle cx="34" cy="11" r="1.6" fill="#f9f4ed" opacity="0.7" />
    </g>
  );
}

/**
 * Three clinking steins: the couple's "3 beers" inside joke, drawn faint behind the bets room.
 * Purely decorative, so it is hidden from assistive tech and carries no strings of its own.
 */
export function BeerMugs({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 330 210" aria-hidden="true" className={className}>
      <Mug transform="translate(20 100) rotate(-14 35 88)" />
      <Mug transform="translate(128 66)" />
      <Mug transform="translate(226 100) rotate(14 35 88)" />
    </svg>
  );
}
